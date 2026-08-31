import Link from "next/link";

import { PARTNER_EMAIL } from "@/domains/marketing/landing-content";
import { SiteWordmark } from "@/lib/brand/site-mark";

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Product", href: "/#top" },
      { label: "Evidence flow", href: "/#how-it-works" },
      { label: "Compatibility", href: "/#compatibility" },
      { label: "Integrity", href: "/#integrity" },
      { label: "Use cases", href: "/#use-cases" },
      { label: "Security", href: "/#security" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: `mailto:${PARTNER_EMAIL}` },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Notice", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="site-dots relative overflow-hidden bg-site-ink pt-[clamp(72px,8vw,112px)] pb-9 text-site-cream"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-0.18em] right-[-0.04em] font-site-sans text-[clamp(112px,19vw,290px)] leading-none font-semibold tracking-[-0.075em] text-site-cream/[0.025] uppercase select-none"
      >
        Subra
      </div>

      <div className="relative z-[1] mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="grid gap-[clamp(52px,7vw,96px)] pb-[clamp(54px,6vw,82px)] [grid-template-columns:minmax(0,1.1fr)_minmax(0,1.35fr)] max-[900px]:grid-cols-1">
          <div className="max-w-[480px]">
            <SiteWordmark variant="white" showProduct={false} />
            <p className="mt-7 max-w-[39ch] text-[clamp(19px,2.1vw,27px)] leading-[1.35] tracking-[-0.025em] text-site-cream/90">
              Evidence and accountability for AI agent actions that matter.
            </p>
            <p className="mt-5 max-w-[48ch] text-[14px] leading-[1.7] text-site-cream/58">
              Signed records that connect identity, authority, ownership and
              action context for independent verification later.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-3 gap-x-[clamp(28px,5vw,76px)] gap-y-10 max-[640px]:grid-cols-1"
          >
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.heading}>
                <h2 className="mb-5 font-site-mono text-[9.5px] uppercase tracking-[0.17em] text-site-accent">
                  {column.heading}
                </h2>
                <ul className="space-y-3.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("mailto:") ? (
                        <a
                          href={link.href}
                          className="text-[14.5px] text-site-cream/68 transition-colors duration-200 hover:text-site-cream"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-[14.5px] text-site-cream/68 transition-colors duration-200 hover:text-site-cream"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-site-hair pt-7">
          <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-3 font-site-mono text-[10px] leading-[1.7] text-site-cream/65">
            <p>© {year} Subra. All rights reserved.</p>
            <p>Subra is not a certified or regulated financial service.</p>
          </div>
          <p className="mt-5 max-w-[92ch] text-[12.5px] leading-[1.7] text-site-cream/64">
            Subra provides evidence and accountability tooling for AI-agent
            actions. It is not a certification, regulatory approval, or legal
            compliance guarantee.
          </p>
        </div>
      </div>
    </footer>
  );
}
