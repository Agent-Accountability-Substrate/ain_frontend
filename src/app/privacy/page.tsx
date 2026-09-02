import type { Metadata } from "next";

import { PrivacyNotice } from "@/domains/marketing/privacy-notice";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "How Subra handles personal data submitted through its public website.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <PrivacyNotice />;
}
