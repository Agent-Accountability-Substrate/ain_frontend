import Link from "next/link";

import { SiteWordmark } from "@/lib/brand/site-mark";
import { cn } from "@/lib/utils";

/** The mark, wordmark and product name, linking back to the landing page. */
export function AuthBrand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Subra AIN Registry"
      className={cn("text-site-ink", className)}
    >
      <SiteWordmark showProduct={false} />
    </Link>
  );
}
