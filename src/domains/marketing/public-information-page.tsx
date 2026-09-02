import { PARTNER_EMAIL } from "@/domains/marketing/landing-content";
import { SiteBackHeader } from "@/domains/marketing/site-back-header";
import { SiteFooter } from "@/domains/marketing/site-footer";

export type InformationSection = {
  title: string;
  body: string;
};

export function PublicInformationPage({
  eyebrow,
  title,
  effectiveDate,
  introduction,
  sections,
  contactHeading,
  contactBody,
}: {
  eyebrow: string;
  title: string;
  effectiveDate?: string;
  introduction: string;
  sections: readonly InformationSection[];
  contactHeading: string;
  contactBody: string;
}) {
  return (
    <>
      <main className="min-h-screen bg-site-paper font-site-sans text-site-ink">
        <SiteBackHeader backHref="/" backLabel="Return to Subra" />

        <article className="mx-auto max-w-[1120px] px-[clamp(20px,4vw,48px)] py-[clamp(64px,9vw,120px)]">
          <div className="grid gap-[clamp(48px,8vw,112px)] [grid-template-columns:minmax(0,0.72fr)_minmax(0,1.28fr)] max-[820px]:grid-cols-1">
            <div>
              <p className="font-site-mono text-[10.5px] uppercase tracking-[0.16em] text-site-accent">
                {eyebrow}
              </p>
              <h1 className="mt-5 text-[clamp(42px,6vw,72px)] leading-[0.98] font-medium tracking-[-0.055em]">
                {title}
              </h1>
              {effectiveDate && (
                <p className="mt-6 font-site-mono text-[11px] uppercase tracking-[0.12em] text-site-muted">
                  Effective {effectiveDate}
                </p>
              )}
            </div>

            <div>
              <p className="max-w-[62ch] text-[18px] leading-[1.7] text-site-ink-soft">
                {introduction}
              </p>

              <div className="mt-12 border-t border-site-rule">
                {sections.map((section, index) => (
                  <section
                    key={section.title}
                    className="grid gap-5 border-b border-site-rule py-8 [grid-template-columns:42px_minmax(0,1fr)]"
                  >
                    <span
                      aria-hidden="true"
                      className="font-site-mono text-[11px] text-site-accent"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h2 className="text-[20px] font-medium tracking-[-0.02em]">
                        {section.title}
                      </h2>
                      <p className="mt-3 max-w-[62ch] text-[15px] leading-[1.75] text-site-ink-soft">
                        {section.body}
                      </p>
                    </div>
                  </section>
                ))}
              </div>

              <aside className="site-dots mt-12 rounded-[18px] bg-site-ink p-[clamp(26px,4vw,42px)] text-site-cream">
                <p className="font-site-mono text-[10px] uppercase tracking-[0.15em] text-site-accent">
                  Contact
                </p>
                <h2 className="mt-4 text-[26px] font-medium tracking-[-0.03em]">
                  {contactHeading}
                </h2>
                <p className="mt-3 max-w-[48ch] text-[15px] leading-[1.7] text-site-cream/75">
                  {contactBody}
                </p>
                <a
                  href={`mailto:${PARTNER_EMAIL}`}
                  className="mt-6 inline-block text-[15px] text-site-cream underline decoration-site-cream/40 underline-offset-[5px] hover:text-site-accent"
                >
                  {PARTNER_EMAIL}
                </a>
              </aside>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
