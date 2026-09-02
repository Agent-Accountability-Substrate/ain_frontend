import type { Metadata } from "next";

import { CookiePolicy } from "@/domains/marketing/cookie-policy";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How the Subra website uses cookies.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return <CookiePolicy />;
}
