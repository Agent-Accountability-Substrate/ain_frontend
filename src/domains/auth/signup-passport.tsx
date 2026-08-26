import { EXAMPLE_AGENT_IN_FORCE } from "@/lib/brand/example-agent";
import { CardOrbit, FingerprintGlyph } from "@/lib/brand/registry-glyphs";

/**
 * The passport on the sign-up panel.
 *
 * Stripe's sign-up shows a dashboard beside the form; the equivalent object
 * here is a registered agent, since that is what the account is for. A static
 * sibling of the landing page's deck card — same orbit and same printed
 * surface, no flip and no deck, because nothing here is interactive.
 *
 * The facts are the landing page's, not a second set typed out here. They are
 * one fictional record shown on two surfaces, so a visitor who sees the
 * landing page and then signs up must not catch the two disagreeing about the
 * example agent's scope or who answers for it.
 */
export function SignupPassport() {
  const version = EXAMPLE_AGENT_IN_FORCE;

  return (
    <div
      className="pass relative flex w-[min(320px,100%)] flex-col overflow-hidden rounded-[14px] border border-site-cream/[0.14] px-[22px] pt-5 pb-[18px] shadow-[0_26px_58px_-30px_rgba(0,0,0,0.85)] [aspect-ratio:348/452] [background:radial-gradient(112%_62%_at_82%_8%,rgba(240,128,60,0.16),transparent_58%),linear-gradient(168deg,#1d1f25_0%,#131418_62%,#0e0f12_100%)]"
      data-live="true"
    >
      <span className="pass-tex pointer-events-none" aria-hidden="true" />

      <CardOrbit className="pointer-events-none z-[1]" nodes={false} />

      <div className="relative z-[2] flex items-center justify-between font-site-mono text-[9.5px] uppercase tracking-[0.14em] text-site-cream-dim select-none">
        <span className="inline-flex items-center">
          <span className="mr-2 -mb-[3px] inline-flex text-site-accent">
            <FingerprintGlyph />
          </span>
          AIN Registry
        </span>
        <span className="text-site-accent">
          {version.id} · {version.event}
        </span>
      </div>

      <div className="relative z-[2] mt-auto text-[17px] font-medium tracking-[-0.022em] text-site-cream">
        {version.name}
      </div>

      <span className="relative z-[2] mt-4 block font-site-mono text-[9.5px] uppercase tracking-[0.14em] text-site-cream-dim">
        Accountable
      </span>
      <span className="relative z-[2] mt-1.5 block text-[15px] font-medium text-site-accent">
        {version.accountable}
      </span>

      <span className="relative z-[2] mt-4 block font-site-mono text-[9.5px] uppercase tracking-[0.14em] text-site-cream-dim">
        Scope
      </span>
      <span className="relative z-[2] mt-1.5 block font-site-mono text-[11.5px] leading-[1.8] text-site-cream-soft">
        {version.scope.map((entry) => (
          <span key={entry} className="block">
            {entry}
          </span>
        ))}
      </span>

      <div className="relative z-[2] mt-5 flex justify-between gap-3 border-t border-site-cream/[0.09] pt-[18px] font-site-mono text-[10.5px] text-site-cream-dim">
        <span>{version.ain}</span>
        <span>{version.issuedOn}</span>
      </div>
    </div>
  );
}
