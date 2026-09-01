# Publishing a post

Add an `.mdx` file to this directory. That is the whole registration step —
there is no list to edit.

## Write the file

`<slug>.mdx`, with a `meta` export before the prose:

```mdx
export const meta = {
  title: "The post title",
  summary: "One sentence. Shown on the index and used as the page description.",
  publishedAt: "2026-09-01",
  standfirst: "The paragraph that sits between the title and the body.",
};

## The first section

Prose here.
```

The filename is the slug. It must be lower-case and hyphenated.

Ordering is by `publishedAt`, newest first. Nothing else needs editing: the
route, the sitemap entry, the index card, the share card and the section
anchors all follow.

## Run `pnpm test`

The suite parses every post's `meta` against a Zod schema and fails if the date
is not ISO, a field is missing, a filename is not a slug, or a body renders
under 500 characters or without an `h2` — which is what a post whose markdown
failed to compile looks like.

## Writing constraints

- **No em dashes.** Asserted against every rendered post.
- **No frontmatter.** Metadata is the `meta` export; no remark plugin parses
  `---` blocks, so one renders as visible text.
- **No tables, strikethrough or footnotes.** `remark-gfm` is not installed, so
  GFM syntax renders literally — a table comes out as rows of `|` characters.
  Adding it is a one-line change in `next.config.ts` if a post needs one.
- **Headings must be unique within a post.** Anchors are slugged from heading
  text, so two headings differing only in punctuation collide.
- Every element the typography map styles is exercised by
  `test/fixtures/mdx-sample.mdx`. If you use markdown it does not cover, add it
  there.
