import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ReactNode } from "react";
import { Children, isValidElement } from "react";

import { cn } from "@/lib/utils";

/**
 * How a post's markdown becomes the site's typography. Required by
 * `@next/mdx`: the App Router build fails without this file, even empty, and
 * MDX emits bare tags with no classes of their own.
 *
 * A reading scale, not the landing page's: body copy is 19px on 1.8 because a
 * post is read for minutes at a stretch where a marketing section is scanned
 * in seconds, and the rhythm comes from spacing rather than rules.
 */

/**
 * The text of a heading, flattened out of whatever MDX passed as children.
 * `## The **version** problem` arrives as an array with an element in it, and
 * stringifying that naively gives an anchor of `[object Object]`.
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

/**
 * A heading's anchor: lower-case, punctuation dropped, spaces hyphenated.
 * Decomposing first folds accents instead of deleting them, so `Café société`
 * slugs to `cafe-societe` rather than `caf-soci-t`.
 *
 * Returns `""` for a heading with no alphanumerics (`## →`); callers render no
 * `id` at all in that case, since `id=""` matches every empty-fragment link.
 */
export function headingId(children: ReactNode): string {
  return headingText(children)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const components: MDXComponents = {
  // Anchored, so a section can be linked to directly. `|| undefined` because
  // React omits the attribute for `undefined` and renders `id=""` for "".
  h2: ({ children, ...props }) => (
    <h2
      id={headingId(children) || undefined}
      className="mt-14 scroll-mt-24 text-[clamp(23px,2.4vw,29px)] leading-[1.2] font-medium tracking-[-0.03em] text-site-ink first:mt-0"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      id={headingId(children) || undefined}
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
  // The bullet is drawn rather than listed, so it can be the brand's accent at
  // a weight `list-disc` cannot. Drawn from the `ul` against its own items, not
  // from a shared `li` map: `ol` re-enables `list-decimal` and an item carrying
  // both renders "1. •". `[&>li>p]:mt-0` is the loose-list case, where markdown
  // wraps each item in a paragraph whose `mt-6` would drop the text below the
  // bullet.
  ul: (props) => (
    <ul
      className="mt-6 space-y-3 text-[19px] leading-[1.8] tracking-[-0.005em] text-site-ink-soft [&>li]:relative [&>li]:pl-7 [&>li]:before:absolute [&>li]:before:top-[0.72em] [&>li]:before:left-1 [&>li]:before:h-1.5 [&>li]:before:w-1.5 [&>li]:before:rounded-full [&>li]:before:bg-site-accent [&>li]:before:content-[''] [&>li>p]:mt-0 [&>li>p+p]:mt-4"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="mt-6 list-decimal space-y-3 pl-6 text-[19px] leading-[1.8] tracking-[-0.005em] text-site-ink-soft marker:font-site-mono marker:text-[14px] marker:text-site-accent [&>li>p]:mt-0 [&>li>p+p]:mt-4"
      {...props}
    />
  ),
  // In-site links route through `next/link` so a post navigates on the client
  // rather than reloading the app shell. Absolute, protocol-relative, `mailto:`
  // and bare `#fragment` stay plain anchors.
  a: ({ href, ...props }) => {
    const target = typeof href === "string" ? href : "";
    return target.startsWith("/") && !target.startsWith("//") ? (
      <Link
        href={target}
        className="text-site-ink underline decoration-site-accent decoration-1 underline-offset-[4px] transition-colors duration-200 ease-site hover:text-site-accent"
        {...props}
      />
    ) : (
      <a
        href={href}
        className="text-site-ink underline decoration-site-accent decoration-1 underline-offset-[4px] transition-colors duration-200 ease-site hover:text-site-accent"
        {...props}
      />
    );
  },
  strong: (props) => (
    <strong className="font-medium text-site-ink" {...props} />
  ),
  em: (props) => <em className="italic" {...props} />,
  // A pull quote, not an indent. Markdown wraps the quote's content in a
  // paragraph, which lands on the `p` map and brings its own size, so the
  // quote's scale has to be pushed onto that child: `text-[length:inherit]` is
  // the size, `text-inherit` only the colour. Both need the arbitrary-value
  // form — bare `leading-inherit` is not a utility and compiles to nothing.
  blockquote: (props) => (
    <blockquote
      className="my-10 border-l-2 border-site-accent pl-7 text-[clamp(21px,2.2vw,25px)] leading-[1.5] tracking-[-0.02em] text-site-ink [&>p]:mt-0 [&>p]:text-[length:inherit] [&>p]:text-inherit [&>p]:leading-[inherit] [&>p+p]:mt-4"
      {...props}
    />
  ),
  // A fenced block arrives as `<pre><code className="language-ts">`, so the
  // class is merged rather than spread over — `{...props}` last would replace
  // the pill and leave the sample unstyled. `pre` scrolls on its own axis so a
  // long line cannot widen the page.
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "mt-6 overflow-x-auto rounded-[10px] bg-site-ink/[0.055] p-5 font-site-mono text-[14.5px] leading-[1.7] text-site-ink [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-[inherit]",
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "rounded-[5px] bg-site-ink/[0.055] px-1.5 py-0.5 font-site-mono text-[15px] text-site-ink",
        className,
      )}
      {...props}
    />
  ),
  // Markdown carries no dimensions, so `next/image` is not available without
  // an author supplying them per image. A plain tag that cannot overflow the
  // reading column is the honest floor: unstyled it runs past 720px and forces
  // the whole page to scroll sideways on a phone. `h-auto` holds the ratio
  // against that width, and `loading="lazy"` keeps a figure below the fold off
  // the critical path. `alt` first, so a post's own alt text replaces it and
  // the a11y rule can still see one.
  img: (props) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className="mt-8 h-auto max-w-full rounded-[10px]"
      loading="lazy"
      {...props}
    />
  ),
  hr: () => <hr className="my-14 border-0 border-t border-site-rule" />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
