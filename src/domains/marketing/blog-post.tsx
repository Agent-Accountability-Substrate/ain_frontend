import Link from "next/link";

import {
  formatPublishedDate,
  type BlogPost,
} from "@/domains/marketing/blog-content";
import { BlogHeader } from "@/domains/marketing/blog-header";
import { PARTNER_EMAIL } from "@/domains/marketing/landing-content";
import { SiteFooter } from "@/domains/marketing/site-footer";

/**
 * One published post.
 *
 * Two grounds, like the landing page: the title sits on the dark stage the
 * hero and the record band share, and the reading column is paper below it.
 * The break between them is where the post starts, which is why the standfirst
 * straddles it rather than sitting inside either.
 *
 * A reading layout, which is why it is not the legal pages' shell: an article
 * is read top to bottom in one column at a measure the eye can track, where a
 * notice is scanned for the clause somebody needs and numbers its sections so
 * they can be cited.
 *
 * The body is the compiled `.mdx`. Its elements are styled by the map in
 * `src/mdx-components.tsx`, not here, because markdown emits bare tags with no
 * classes of their own.
 *
 * The closing call to action sits outside `<article>` on purpose. It is site
 * furniture rather than part of what was written, and inside the element it
 * put a marketing heading into the post's own outline.
 */
export function BlogPostPage({ post }: { post: BlogPost }) {
  return (
    <>
      <main className="bg-site-paper font-site-sans text-site-ink">
        <div className="site-dots relative overflow-hidden bg-site-ink pb-[clamp(72px,9vw,120px)]">
          <BlogHeader backHref="/blog" backLabel="All insights" />

          <div className="relative z-[1] mx-auto max-w-[1120px] px-[clamp(20px,4vw,48px)] pt-[clamp(44px,6vw,80px)]">
            <div className="flex items-center gap-[13px] font-site-mono text-[11px] font-medium uppercase tracking-[0.16em] text-site-cream-soft select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-site-accent" />
              Insights
              <span className="h-px flex-none basis-[46px] bg-site-hair" />
              <time dateTime={post.publishedAt}>
                {formatPublishedDate(post.publishedAt)}
              </time>
            </div>

            <h1 className="mt-9 max-w-[19ch] text-[clamp(38px,5.6vw,68px)] leading-[1.03] font-medium tracking-[-0.042em] text-site-cream">
              {post.title}
            </h1>
          </div>
        </div>

        <article className="mx-auto max-w-[1120px] px-[clamp(20px,4vw,48px)]">
          <div className="max-w-[720px]">
            {/* Lifted into the dark block above, so the standfirst is the seam
                between the title and the body rather than the top of the body.
                `relative z-[1]` is load bearing: the dark block is positioned
                and would otherwise paint over the lifted edge, clipping the
                first line of the card. */}
            <p className="relative z-[1] -mt-[clamp(36px,4.5vw,60px)] rounded-[18px] bg-site-paper px-[clamp(22px,3vw,40px)] py-[clamp(26px,3.2vw,42px)] text-[clamp(21px,2.3vw,26px)] leading-[1.5] font-medium tracking-[-0.025em] text-site-ink shadow-[0_24px_60px_-32px_rgba(9,17,38,0.45)]">
              {post.standfirst}
            </p>

            <div className="mt-[clamp(44px,5vw,68px)]">
              <post.Content />
            </div>
          </div>
        </article>

        <div className="mx-auto max-w-[1120px] px-[clamp(20px,4vw,48px)] pb-[clamp(64px,8vw,104px)]">
          <div className="max-w-[720px]">
            <aside className="site-dots relative mt-[clamp(64px,8vw,104px)] overflow-hidden rounded-[20px] bg-site-ink p-[clamp(30px,4vw,48px)] text-site-cream">
              <div className="relative z-[1]">
                <div className="flex items-center gap-[11px] font-site-mono text-[10.5px] uppercase tracking-[0.15em] text-site-cream-soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-site-accent" />
                  Private preview
                </div>
                <h2 className="mt-5 max-w-[30ch] text-[clamp(25px,3vw,32px)] leading-[1.12] font-medium tracking-[-0.032em]">
                  See this against your own agents
                </h2>
                <p className="mt-4 max-w-[52ch] text-[16px] leading-[1.7] text-site-cream-soft">
                  Subra is running with a small number of organisations. Get in
                  touch if you want to walk through how this works on a real
                  workflow.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
                  <Link
                    href="/#request"
                    className="inline-flex items-center justify-center rounded-full bg-site-cream px-[26px] py-[13px] text-[15px] font-medium tracking-[-0.012em] text-site-ink transition-colors duration-300 hover:bg-[#dfdbd2]"
                  >
                    Request access
                  </Link>
                  <a
                    href={`mailto:${PARTNER_EMAIL}`}
                    className="font-site-mono text-[12px] uppercase tracking-[0.12em] text-site-cream-soft transition-colors duration-200 hover:text-site-accent"
                  >
                    {PARTNER_EMAIL}
                  </a>
                </div>
              </div>
            </aside>

            <p className="mt-11 border-t border-site-rule pt-8">
              <Link
                href="/blog"
                className="group inline-flex items-center gap-2 font-site-mono text-[11px] uppercase tracking-[0.13em] text-site-accent transition-colors duration-200 hover:text-site-ink"
              >
                More insights
                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  &rarr;
                </span>
              </Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
