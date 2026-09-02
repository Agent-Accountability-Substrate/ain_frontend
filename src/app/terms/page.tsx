import type { Metadata } from "next";

import { TermsOfService } from "@/domains/marketing/terms-of-service";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the Subra website and private preview.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <TermsOfService />;
}
