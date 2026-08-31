import type { Metadata } from "next";

import { AboutSubra } from "@/domains/marketing/about-subra";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Subra is building evidence and accountability infrastructure for AI-agent actions.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutSubra />;
}
