/**
 * The passport on the sign-up panel.
 *
 * Stripe's sign-up shows a dashboard beside the form; the equivalent object
 * here is a registered agent, since that is what the account is for. A static
 * sibling of the landing page's deck card — same orbit and same printed
 * surface, no flip and no deck, because nothing here is interactive.
 */
export function SignupPassport() {
  return (
    <div
      className="pass relative flex w-[min(320px,100%)] flex-col overflow-hidden rounded-[14px] border border-site-cream/[0.14] px-[22px] pt-5 pb-[18px] shadow-[0_26px_58px_-30px_rgba(0,0,0,0.85)] [aspect-ratio:348/452] [background:radial-gradient(112%_62%_at_82%_8%,rgba(240,128,60,0.16),transparent_58%),linear-gradient(168deg,#1d1f25_0%,#131418_62%,#0e0f12_100%)]"
      data-live="true"
    >
      <span className="pass-tex pointer-events-none" aria-hidden="true" />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[15%] right-[-11.25%] z-[1] block aspect-square w-[62.5%] opacity-90"
      >
        <span className="pass-orbit-ring animate-site-orbit absolute inset-0 rounded-full" />
        <span className="pass-orbit-ring animate-site-orbit-mid absolute inset-[16.7%] rounded-full border-dashed" />
        <span className="pass-orbit-core absolute inset-[35%] flex items-center justify-center rounded-full">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-[44%] w-[44%] text-white/90"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        </span>
      </span>

      <div className="relative z-[2] flex items-center justify-between font-site-mono text-[9.5px] uppercase tracking-[0.14em] text-site-cream-dim select-none">
        <span className="inline-flex items-center">
          <span className="mr-2 -mb-[3px] inline-flex text-site-accent">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="block h-3.5 w-3.5"
            >
              <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
              <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
              <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
              <path d="M2 12a10 10 0 0 1 18-6" />
              <path d="M2 16h.01" />
              <path d="M21.8 16c.2-2 .131-5.354 0-6" />
              <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
              <path d="M8.65 22c.21-.66.45-1.32.57-2" />
              <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
            </svg>
          </span>
          AIN Registry
        </span>
        <span className="text-site-accent">v3 · in force</span>
      </div>

      <div className="relative z-[2] mt-auto text-[17px] font-medium tracking-[-0.022em] text-site-cream">
        Payments Operations Agent
      </div>

      <span className="relative z-[2] mt-4 block font-site-mono text-[9.5px] uppercase tracking-[0.14em] text-site-cream-dim">
        Accountable
      </span>
      <span className="relative z-[2] mt-1.5 block text-[15px] font-medium text-site-accent">
        Head of Operational Resilience
      </span>

      <span className="relative z-[2] mt-4 block font-site-mono text-[9.5px] uppercase tracking-[0.14em] text-site-cream-dim">
        Scope
      </span>
      <span className="relative z-[2] mt-1.5 block font-site-mono text-[11.5px] leading-[1.8] text-site-cream-soft">
        <span className="block">payments.initiate</span>
        <span className="block">payments.refund</span>
      </span>

      <div className="relative z-[2] mt-5 flex justify-between gap-3 border-t border-site-cream/[0.09] pt-[18px] font-site-mono text-[10.5px] text-site-cream-dim">
        <span>01BX 5ZZK BKAC TAV9</span>
        <span>23 Jul 2026</span>
      </div>
    </div>
  );
}
