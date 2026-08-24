import type { Metadata } from "next";

import { AccessForm } from "@/domains/marketing/access-form";
import { CtaBand } from "@/domains/marketing/cta-band";
import { IntegrityChain } from "@/domains/marketing/integrity-chain";
import { RecordBand } from "@/domains/marketing/record-band";
import { ScopeArtifact } from "@/domains/marketing/scope-artifact";
import { SiteFaq } from "@/domains/marketing/site-faq";
import { SiteFooter } from "@/domains/marketing/site-footer";
import { SiteHero } from "@/domains/marketing/site-hero";
import { SiteNav } from "@/domains/marketing/site-nav";
import { SiteStage } from "@/domains/marketing/site-stage";

export const metadata: Metadata = {
  // `absolute` bypasses the root template: this is the page a search result
  // and a shared link land on, so it states the whole proposition rather than
  // "AIN Registry · Subra".
  title: {
    absolute: "Subra: The accountability register for autonomous agents",
  },
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

/**
 * The public landing page.
 *
 * Shows no tenant data and requires no session, so it is static: nothing here
 * reads `auth()` or the registry, and the page must render identically for a
 * signed-in visitor and a stranger. Keep it that way — a personalised landing
 * page is how tenant data ends up on the one route that has no login.
 *
 * The hero and the record band share one dark stage that opens from an inset
 * card to full bleed as it scrolls; everything below it is paper.
 *
 * `leading-[normal]` is not decoration: Tailwind's Preflight sets `1.5` on
 * `html` and the mockup leaves it at `normal`, which is a few pixels a line
 * across every element that does not state its own — the nav, the chips, the
 * passport's record, the FAQ. Scoped to this subtree so the workspace keeps
 * Preflight's default.
 */
export default function LandingPage() {
  return (
    <div
      id="top"
      className="bg-site-paper font-site-sans leading-[normal] text-site-ink"
    >
      <SiteNav />

      <SiteStage>
        <SiteHero />
        <RecordBand />
      </SiteStage>

      <ScopeArtifact />
      <IntegrityChain />
      <CtaBand />
      <SiteFaq />
      <AccessForm />
      <SiteFooter />
    </div>
  );
}
