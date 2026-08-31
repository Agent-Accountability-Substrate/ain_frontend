import type { MDXContent } from "mdx/types";
import { z } from "zod";

import Accountability, {
  meta as accountability,
} from "@/domains/marketing/posts/the-accountability-gap-in-autonomous-ai.mdx";

/**
 * Every published post, as a registry over the `.mdx` files beside this one.
 *
 * The prose lives in markdown so a post can carry a list, a link or a quote
 * without being escaped into a TypeScript string literal. What markdown cannot
 * carry is the data the rest of the site reads off a post: the index needs a
 * title and a summary, the sitemap needs a slug and a date, and neither should
 * have to parse a document to find them. So each file exports a `meta` const
 * and this module is the one place that knows which files exist.
 *
 * One `import` per post. That is the cost of not reading the filesystem at
 * build time, and it buys a list the compiler and the tests can both see.
 */

/**
 * `tsc` cannot look inside an `.mdx` file, so a misspelled key or a missing
 * date would otherwise surface as `undefined` rendered into the page. Parsed
 * at module load, which fails the build rather than shipping a blank heading.
 */
const metaSchema = z.object({
  /** The URL segment. Lower-case, hyphenated, never changed once shared. */
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().min(1),
  /** One sentence, shown on the index and used as the page description. */
  summary: z.string().min(1),
  /** ISO 8601. Rendered through `formatPublishedDate`, never printed raw. */
  publishedAt: z.iso.date(),
  /** The standfirst, shown above the body on the post itself. */
  standfirst: z.string().min(1),
});

export type BlogPost = z.infer<typeof metaSchema> & {
  /** The compiled markdown body. */
  readonly Content: MDXContent;
};

function post(meta: unknown, Content: MDXContent): BlogPost {
  return { ...metaSchema.parse(meta), Content };
}

/**
 * Newest first, by hand.
 *
 * Ordered in the source rather than sorted here: with a list this short a
 * comparator is a function no test can reach, and an unreachable comparator is
 * worse than an invariant a test asserts. `blog-content.test.ts` fails if this
 * stops being descending.
 */
export const BLOG_POSTS: readonly BlogPost[] = [
  post(accountability, Accountability),
];

/** The post at `slug`, or `undefined` when nothing is published there. */
export function findPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((entry) => entry.slug === slug);
}

/**
 * The publication date as a reader sees it.
 *
 * Locale and time zone are both pinned. Left to the host, `31 August` renders
 * as `30 August` anywhere west of UTC and the server and the browser can
 * disagree about the same post.
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
