import Link from "next/link";

import {
  BLOG_TITLE,
  formatPublishedDate,
  listPosts,
} from "@/domains/marketing/blog-content";
import { SiteBackHeader } from "@/domains/marketing/site-back-header";
import { SiteFooter } from "@/domains/marketing/site-footer";

/**
 * The index of published posts.
 *
 * The newest post is given the room, and everything behind it is a row. A
 * uniform list reads as an archive whatever is in it, which is the wrong first
 * impression for a section that is meant to be read; leading with one piece
 * says which one to start with. With a single post published the lead is the
 * whole page, which is the same design rather than a special case.
 *
 * No empty state. The index ships with a post in it, and the directory is
 * read at build time, so an empty list is a commit nobody would make.
 */
export async function BlogIndex() {
  const [lead, ...rest] = await listPosts();

  return (
    <>
      <main className="bg-site-paper font-site-sans text-site-ink">
        <div className="site-dots relative overflow-hidden bg-site-ink pb-[clamp(56px,7vw,92px)]">
          <SiteBackHeader tone="ink" backHref="/" backLabel="Return to Subra" />

          <div className="relative z-[1] mx-auto max-w-[1120px] px-[clamp(20px,4vw,48px)] pt-[clamp(44px,6vw,80px)]">
            <div className="flex items-center gap-[13px] font-site-mono text-[11px] font-medium uppercase tracking-[0.16em] text-site-cream-soft select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-site-accent" />
              Writing
            </div>
            <h1 className="mt-8 text-[clamp(44px,6.4vw,78px)] leading-[0.98] font-medium tracking-[-0.05em] text-site-cream">
              {BLOG_TITLE}
            </h1>
            <p className="mt-7 max-w-[52ch] text-[17px] leading-[1.65] text-site-cream-soft">
              Notes from the team on accountability, evidence and authority for
              the actions AI agents take.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1120px] px-[clamp(20px,4vw,48px)] pb-[clamp(72px,9vw,120px)]">
          {lead && (
            <Link
              href={`/blog/${lead.slug}`}
              className="group relative z-[1] block -mt-[clamp(30px,4vw,52px)] rounded-[20px] bg-site-paper p-[clamp(26px,4vw,52px)] shadow-[0_28px_70px_-38px_rgba(9,17,38,0.5)] transition-shadow duration-300 hover:shadow-[0_32px_80px_-34px_rgba(9,17,38,0.55)]"
            >
              <div className="flex items-center gap-[11px] font-site-mono text-[10.5px] uppercase tracking-[0.15em] text-site-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-site-accent" />
                Latest
                <span className="h-px flex-none basis-[38px] bg-site-rule" />
                <time dateTime={lead.publishedAt} className="text-site-muted">
                  {formatPublishedDate(lead.publishedAt)}
                </time>
              </div>
              <h2 className="mt-7 max-w-[20ch] text-[clamp(30px,3.8vw,46px)] leading-[1.06] font-medium tracking-[-0.038em] transition-colors duration-200 group-hover:text-site-accent">
                {lead.title}
              </h2>
              <p className="mt-6 max-w-[62ch] text-[17px] leading-[1.7] text-site-ink-soft">
                {lead.summary}
              </p>
              <span className="mt-8 inline-flex items-center gap-2 font-site-mono text-[11px] uppercase tracking-[0.13em] text-site-accent">
                Read the piece
                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  &rarr;
                </span>
              </span>
            </Link>
          )}

          {rest.length > 0 && (
            <ul
              aria-label="Earlier posts"
              className="mt-[clamp(48px,6vw,80px)] border-t border-site-rule"
            >
              {rest.map((post) => (
                <li key={post.slug} className="border-b border-site-rule">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group grid gap-6 py-9 [grid-template-columns:minmax(0,0.26fr)_minmax(0,1fr)] max-[720px]:grid-cols-1 max-[720px]:gap-3"
                  >
                    <time
                      dateTime={post.publishedAt}
                      className="font-site-mono text-[11px] uppercase tracking-[0.12em] text-site-muted"
                    >
                      {formatPublishedDate(post.publishedAt)}
                    </time>
                    <div>
                      <h2 className="max-w-[26ch] text-[clamp(22px,2.4vw,29px)] leading-[1.18] font-medium tracking-[-0.03em] transition-colors duration-200 group-hover:text-site-accent">
                        {post.title}
                      </h2>
                      <p className="mt-4 max-w-[62ch] text-[16px] leading-[1.7] text-site-ink-soft">
                        {post.summary}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
