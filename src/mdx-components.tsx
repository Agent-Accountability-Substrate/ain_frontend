import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { Children, isValidElement } from "react";

/**
 * How a post's markdown becomes the site's typography.
 *
 * Required by `@next/mdx`: the App Router build fails without this file, even
 * empty. MDX emits bare `<h2>` and `<p>` with no classes, so without a map the
 * prose renders at browser defaults on a page whose type scale is tuned
 * everywhere else.
 *
 * The scale here is a reading scale, not the landing page's. Body copy is 19px
 * on 1.8 because a post is read for several minutes at a stretch, where a
 * marketing section is scanned in seconds; the section headings sit close to
 * the paragraph they open and far from the one above, so the rhythm of the
 * page comes from the spacing rather than from rules.
 *
 * Elements are declared here rather than imported from `domains/marketing/`.
 * That surface is a leaf, and this file sits above every domain: importing out
 * of it is the thing `eslint.config.mjs` forbids.
 */

/**
 * The text of a heading, flattened out of whatever MDX passed as children.
 *
 * A heading is usually a plain string, but `## The **version** problem`
 * arrives as an array with an element in it. Ignoring that would produce an
 * anchor of `[object Object]` on exactly the headings worth linking to.
 */
function headingText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      if (isValidElement<{ children?: ReactNode }>(child)) {
        return headingText(child.props.children);
      }
      return "";
    })
    .join("");
}

/** A heading's anchor: lower-case, punctuation dropped, spaces hyphenated. */
export function headingId(children: ReactNode): string {
  return headingText(children)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const components: MDXComponents = {
  // Anchored so a section can be linked to directly. Sections are how anyone
  // refers to a post they have read, and `#logs-are-not-evidence` is the
  // difference between sending someone the argument and sending them the page.
  h2: ({ children, ...props }) => (
    <h2
      id={headingId(children)}
      className="mt-14 scroll-mt-24 text-[clamp(23px,2.4vw,29px)] leading-[1.2] font-medium tracking-[-0.03em] text-site-ink first:mt-0"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      id={headingId(children)}
      className="mt-10 scroll-mt-24 text-[20px] leading-[1.3] font-medium tracking-[-0.02em] text-site-ink"
      {...props}
    >
      {children}
    </h3>
  ),
  p: (props) => (
    <p
      className="mt-6 text-[19px] leading-[1.8] tracking-[-0.005em] text-site-ink-soft"
      {...props}
    />
  ),
  ul: (props) => (
    <ul
      className="mt-6 space-y-3 text-[19px] leading-[1.8] tracking-[-0.005em] text-site-ink-soft"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="mt-6 list-decimal space-y-3 pl-6 text-[19px] leading-[1.8] tracking-[-0.005em] text-site-ink-soft marker:font-site-mono marker:text-[14px] marker:text-site-accent"
      {...props}
    />
  ),
  // The bullet is drawn rather than listed, so it can be the brand's accent at
  // a weight a `list-disc` marker cannot be given.
  li: ({ children, ...props }) => (
    <li className="relative pl-7" {...props}>
      <span
        aria-hidden="true"
        className="absolute top-[0.72em] left-1 h-1.5 w-1.5 rounded-full bg-site-accent"
      />
      {children}
    </li>
  ),
  a: (props) => (
    <a
      className="text-site-ink underline decoration-site-accent decoration-1 underline-offset-[4px] transition-colors duration-200 hover:text-site-accent"
      {...props}
    />
  ),
  strong: (props) => (
    <strong className="font-medium text-site-ink" {...props} />
  ),
  em: (props) => <em className="italic" {...props} />,
  // A pull quote, not an indent. Set larger than the body and in ink, so a
  // quoted line reads as the emphasis the author meant it as.
  blockquote: (props) => (
    <blockquote
      className="my-10 border-l-2 border-site-accent pl-7 text-[clamp(21px,2.2vw,25px)] leading-[1.5] tracking-[-0.02em] text-site-ink [&>p]:mt-0 [&>p]:text-inherit [&>p]:leading-inherit [&>p+p]:mt-4"
      {...props}
    />
  ),
  code: (props) => (
    <code
      className="rounded-[5px] bg-site-ink/[0.055] px-1.5 py-0.5 font-site-mono text-[15px] text-site-ink"
      {...props}
    />
  ),
  hr: () => <hr className="my-14 border-0 border-t border-site-rule" />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
