import { cn } from "@/lib/utils";

/**
 * The Subra mark, inline rather than an `<img>`.
 *
 * In `lib/` because every surface wears it — the landing page and the auth
 * screens today, the workspace when its own `subra-logo` joins them. A domain
 * would make the other surfaces import sideways for it.
 *
 * The square is `currentColor` and the rules are punched out of it, so the
 * mark inverts with whatever it sits on — ink on paper in the nav, cream on
 * ink in the footer — from one element. The orange rule is the exception: it
 * is the brand's one fixed colour and never inverts.
 */
function SiteMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={cn("block h-[21px] w-[21px]", className)}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M6.4 1.6H17.6A4.8 4.8 0 0 1 22.4 6.4V17.6A4.8 4.8 0 0 1 17.6 22.4H6.4A4.8 4.8 0 0 1 1.6 17.6V6.4A4.8 4.8 0 0 1 6.4 1.6ZM7 6.4H17V8.6H7ZM7 10.9H17V13.1H7Z"
      />
      <rect x="7" y="15.4" width="5.6" height="2.2" fill="#F0803C" />
    </svg>
  );
}

/**
 * Mark, wordmark, and the product name it belongs to. `sub` is dropped on
 * narrow viewports where the divider would crowd the burger.
 */
export function SiteWordmark({
  className,
  showProduct = true,
}: {
  className?: string;
  showProduct?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-[13px]", className)}>
      <SiteMark />
      <span className="text-[21px] font-semibold tracking-[-0.03em]">
        Subra
      </span>
      {showProduct ? (
        <>
          <span className="h-[18px] w-px bg-current opacity-[0.13]" />
          <span className="font-site-mono text-[9.5px] uppercase tracking-[0.15em] opacity-60">
            AIN Registry
          </span>
        </>
      ) : null}
    </span>
  );
}
