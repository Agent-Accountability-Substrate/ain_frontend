import { SiteWordmark } from "@/lib/brand/site-mark";
import {
  PARTNER_EMAIL,
  SECTION_LINKS,
} from "@/domains/marketing/landing-content";

const COLUMNS = [
  {
    heading: "Product",
    // The same three the nav offers, from the same list — a footer that names
    // the sections differently to the header is two vocabularies for one page.
    links: SECTION_LINKS,
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#record" },
      { label: "Beta", href: "#request" },
      { label: PARTNER_EMAIL, href: `mailto:${PARTNER_EMAIL}` },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy notice", href: "#request" },
      { label: "Terms", href: "#request" },
      { label: "Cookies", href: "#request" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-dots relative overflow-clip bg-site-ink pt-[84px] pb-10 text-site-cream">
      <div className="relative z-[1] mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="grid gap-[70px] pb-[60px] [grid-template-columns:minmax(0,1fr)_minmax(0,1.15fr)] max-[1000px]:grid-cols-[minmax(0,1fr)] max-[1000px]:gap-11">
          <div>
            <SiteWordmark className="text-site-cream" variant="inverse" />
            <p className="mt-[22px] max-w-[44ch] text-[15px] leading-[1.65] text-site-cream-soft">
              The accountability register for autonomous agents. Built for UK
              regulated firms, and never in your agents’ runtime path.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-3 gap-8 max-[700px]:grid-cols-2 max-[700px]:gap-x-5 max-[700px]:gap-y-[30px]"
          >
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <div className="mb-[18px] font-site-mono text-[9.5px] uppercase tracking-[0.14em] text-site-cream-dim select-none">
                  {column.heading}
                </div>
                {column.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="mb-3 block text-[14.5px] text-site-cream-soft select-none hover:text-site-accent"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap justify-between gap-10 border-t border-site-hair pt-[26px] font-site-mono text-[10.5px] leading-[1.7] text-site-cream-dim">
          <span>© 2026 Subra Inc. All rights reserved.</span>
          <span>
            Subra is not regulatory advice and is not endorsed by or affiliated
            with any regulator.
          </span>
        </div>
      </div>
    </footer>
  );
}
