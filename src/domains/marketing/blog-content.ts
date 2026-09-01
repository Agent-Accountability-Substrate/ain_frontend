import type { MDXContent } from "mdx/types";

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
 * See `posts/README.md` for how to publish one.
 */

/** The shape of a filename that can be a post, and so of a servable slug. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type PostModule = { readonly meta: unknown; readonly default: MDXContent };

// Typed as `() => Promise<unknown>` by Next, which is the honest type for a
// glob: nothing has checked what the files export. `meta` stays `unknown`
// past the cast and is only read through `BlogPostMeta`, which the schema
// test enforces.
const POSTS = import.meta.glob("./posts/*.mdx") as Record<
  string,
  () => Promise<PostModule>
>;

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

export type BlogPost = BlogPostMeta & {
  /** The filename, which is the URL segment. Permanent once shared. */
  readonly slug: string;
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

/** The post at `slug`, or `undefined` when nothing is published there. */
export async function findPost(slug: string): Promise<BlogPost | undefined> {
  // An exact lookup in a map the bundler built, so a slug off the URL selects
  // a post or nothing at all; it never reaches a module specifier.
  const load = POSTS[`./posts/${slug}.mdx`];
  if (!load) return undefined;

  const post = await load();
  return { ...(post.meta as BlogPostMeta), slug, Content: post.default };
}

/** Every published post, newest first. */
export async function listPosts(): Promise<BlogPost[]> {
  const slugs = slugsFrom(Object.keys(POSTS));

  const posts = (await Promise.all(slugs.map(findPost))).filter(
    (post): post is BlogPost => post !== undefined,
  );

  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
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
