import type { MDXContent } from "mdx/types";
import { cache } from "react";

/**
 * The published posts, which are the `.mdx` files in `posts/`.
 *
 * A file in that directory is a post. `import.meta.glob` hands the bundler the
 * pattern rather than a list, so the directory is the registry: adding a file
 * adds a post, and the dev server picks one up as it would any other edit.
 *
 * Nothing reads the filesystem at runtime — the glob is resolved at build time
 * — so this works the same wherever a route runs.
 *
 * `import.meta.glob` is Turbopack-only; Next's docs are explicit that it is
 * not available under webpack. `next build --webpack` therefore cannot build
 * the blog, and moving off Turbopack means replacing both globs below.
 *
 * See `posts/README.md` for how to publish one.
 */

/** The shape of a filename that can be a post, and so of a servable slug. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type PostModule = { readonly meta: unknown; readonly default: MDXContent };

// Typed as `() => Promise<unknown>` by Next, which is the honest type for a
// glob: nothing has checked what the files export. `meta` stays `unknown`
// past the cast and is only read through `BlogPostMeta`, which the schema
// test enforces.
//
// Two globs over one pattern, keyed identically. This one is lazy and carries
// the compiled body, so loading a post costs one chunk.
const POSTS = import.meta.glob("./posts/*.mdx") as Record<
  string,
  () => Promise<PostModule>
>;

// The metadata alone, eager so it inlines. The index and the sitemap read
// every post but render none of them, and against `POSTS` that pulled in and
// evaluated the full compiled prose of the whole archive to print a list of
// titles. `import: "meta"` leaves the bodies behind `findPost`.
const POST_META = import.meta.glob("./posts/*.mdx", {
  import: "meta",
  eager: true,
}) as Record<string, unknown>;

/**
 * What every post's `meta` export carries. `slug` is not among them: it is the
 * filename.
 *
 * `tsc` cannot look inside an `.mdx` file — `src/types/mdx.d.ts` types the
 * export as `unknown` — so this shape is asserted here and checked in
 * `blog-content.test.ts`, which parses every published post against a Zod
 * schema. Keeping the schema there leaves the Zod runtime out of the routes.
 */
export type BlogPostMeta = {
  readonly title: string;
  /** One sentence, shown on the index and used as the page description. */
  readonly summary: string;
  /** ISO 8601. Rendered through `formatPublishedDate`, never printed raw. */
  readonly publishedAt: string;
  /** The standfirst, shown above the body on the post itself. */
  readonly standfirst: string;
};

/** A post without its body: what the index and the sitemap need. */
export type BlogPostSummary = BlogPostMeta & {
  /** The filename, which is the URL segment. Permanent once shared. */
  readonly slug: string;
};

export type BlogPost = BlogPostSummary & {
  /** The compiled markdown body. */
  readonly Content: MDXContent;
};

/** `./posts/a-slug.mdx` -> `a-slug`. */
function slugOf(path: string): string {
  return path.slice("./posts/".length, -".mdx".length);
}

/**
 * The slugs behind `paths`, refusing any filename that cannot be a URL
 * segment — otherwise the post is published at an address nothing links to
 * correctly, and nothing says why.
 *
 * Exported for its test: the glob is fixed when the bundle is built, so a test
 * cannot put a badly named file into it.
 */
export function slugsFrom(paths: readonly string[]): string[] {
  const slugs = paths.map(slugOf);
  const unusable = slugs.filter((slug) => !SLUG.test(slug));

  if (unusable.length > 0) {
    throw new Error(
      `Post filenames must be lower-case and hyphenated: ${unusable.join(", ")}`,
    );
  }
  return slugs;
}

/**
 * The post at `slug`, or `undefined` when nothing is published there.
 *
 * `cache`d because the route calls it twice for one request — once in
 * `generateMetadata` and once in the page — and neither knows about the other.
 *
 * The shape is checked before the lookup rather than left to whatever the
 * lookup happens to resolve. The map the bundler built would miss on anything
 * unslug-like anyway, but that is a property of this implementation, not a
 * guard: it is what stops holding the day a slug reaches a module specifier.
 */
export const findPost = cache(
  async (slug: string): Promise<BlogPost | undefined> => {
    if (!SLUG.test(slug)) return undefined;

    const load = POSTS[`./posts/${slug}.mdx`];
    if (!load) return undefined;

    const post = await load();
    return { ...(post.meta as BlogPostMeta), slug, Content: post.default };
  },
);

/**
 * Every published post, newest first, without the bodies.
 *
 * Reads `POST_META`, so listing the archive costs no compiled prose. `async`
 * because the callers await it and because where the metadata comes from is
 * this module's business, not theirs.
 */
export async function listPosts(): Promise<BlogPostSummary[]> {
  const slugs = slugsFrom(Object.keys(POST_META));

  return slugs
    .map((slug) => ({
      ...(POST_META[`./posts/${slug}.mdx`] as BlogPostMeta),
      slug,
    }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * Locale and time zone are pinned: left to the host, `31 August` renders as
 * `30 August` anywhere west of UTC and the server and browser disagree.
 */
export function formatPublishedDate(publishedAt: string): string {
  return new Date(publishedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const BLOG_TITLE = "Insights";
export const BLOG_DESCRIPTION =
  "Writing from the Subra team on accountability, evidence and authority for AI-agent actions.";
