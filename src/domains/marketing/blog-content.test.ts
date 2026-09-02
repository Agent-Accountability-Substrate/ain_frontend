import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  findPost,
  formatPublishedDate,
  listPosts,
  slugsFrom,
} from "@/domains/marketing/blog-content";

/**
 * The shape `blog-content.ts` asserts of every `meta` and cannot check itself.
 * `slug` is not here: it is the filename, not something a post declares.
 *
 * `tsc` cannot see inside an `.mdx` file, so the registry casts. The cast is
 * only as good as this, which is why it runs over every published post rather
 * than a sample. Kept here rather than at module load so the Zod runtime stays
 * out of the sitemap and the two blog routes, all three of which import that
 * module.
 */
const metaSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  publishedAt: z.iso.date(),
  standfirst: z.string().min(1),
});

describe("blog content", () => {
  it("gives every post the metadata the rest of the site reads", async () => {
    // A misspelled key or a missing date would otherwise reach the page as
    // `undefined` — a blank heading, or an `Invalid Date` under a post.
    for (const post of await listPosts()) {
      expect(() => metaSchema.parse(post)).not.toThrow();
    }
  });

  it("publishes at least one post", async () => {
    // The index has no empty state, and an Insights link in the footer that
    // lands on nothing is worse than no link.
    expect((await listPosts()).length).toBeGreaterThan(0);
  });

  it("takes each post's slug from its filename", async () => {
    const dir = join(process.cwd(), "src/domains/marketing/posts");
    const files = (await readdir(dir))
      .filter((name) => name.endsWith(".mdx"))
      .map((name) => name.slice(0, -".mdx".length))
      .sort();

    expect((await listPosts()).map((post) => post.slug).sort()).toEqual(files);
  });

  it("refuses a filename that cannot be a URL segment", () => {
    // Publishing it at a mangled address, or skipping it in silence, are both
    // worse than failing the build with the filename in the message.
    expect(() => slugsFrom(["./posts/Not A Slug.mdx"])).toThrow("Not A Slug");
    expect(() => slugsFrom(["./posts/trailing-.mdx"])).toThrow("trailing-");
    expect(slugsFrom(["./posts/a-real-slug.mdx"])).toEqual(["a-real-slug"]);
  });

  it("orders posts newest first", async () => {
    // The list is hand-ordered rather than sorted, so this is the only thing
    // holding the invariant the index renders on.
    const dates = (await listPosts()).map((post) =>
      Date.parse(post.publishedAt),
    );

    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
  });

  it("writes the prose without em dashes", async () => {
    // The house rule every rendered page is asserted against. Rendered
    // rather than read off a field, because the body is markdown, and pulled
    // through `findPost` because the list carries metadata alone.
    for (const summary of await listPosts()) {
      const post = (await findPost(summary.slug))!;
      const { container } = render(createElement(post.Content));

      expect(container.textContent).not.toContain("—");
      expect(
        [post.title, post.summary, post.standfirst].join(" "),
      ).not.toContain("—");
    }
  });

  it("gives every post a body with something in it", async () => {
    // A post whose markdown failed to compile still satisfies the schema,
    // because the schema only sees `meta`.
    for (const summary of await listPosts()) {
      const post = (await findPost(summary.slug))!;
      const { container } = render(createElement(post.Content));

      expect(container.querySelectorAll("h2").length).toBeGreaterThan(0);
      expect(container.textContent!.length).toBeGreaterThan(500);
    }
  });

  it("finds a published post and nothing else", async () => {
    const first = (await listPosts())[0]!;

    expect((await findPost(first.slug))?.slug).toBe(first.slug);
    expect(await findPost("not-a-post")).toBeUndefined();
  });

  it("formats the date in UTC, so it cannot shift a day by host", async () => {
    // Left to the host locale this renders as 30 August anywhere west of UTC,
    // and the server and the browser disagree about the same post.
    expect(formatPublishedDate("2026-08-31")).toBe("31 August 2026");
    expect(formatPublishedDate("2026-01-01")).toBe("1 January 2026");
  });
});
