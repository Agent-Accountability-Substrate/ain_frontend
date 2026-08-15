import type { Metadata } from "next";
import { Instrument_Serif, Poppins } from "next/font/google";

import "./globals.css";

// Self-hosted at build time, never fetched from Google at runtime: a runtime
// font request discloses the visitor's IP to a US server before first paint,
// which LG München I (3 O 17493/20) held unlawful — on the page claiming UK/EU
// residency. Do not replace this with an @import.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://subrahq.com"),
  applicationName: "AIN Registry",
  title: {
    default: "AIN Registry · Subra",
    template: "%s · AIN Registry",
  },
  description:
    "The accountability register for autonomous agents: a permanent identifier, a signed record of what an agent may do, and the person who answers for it. Built for UK regulated firms.",
  openGraph: {
    type: "website",
    siteName: "AIN Registry",
    locale: "en_GB",
    title: "AIN Registry · Subra",
    description:
      "A permanent identifier, a signed record of what an agent may do, and the person who answers for it.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIN Registry · Subra",
    description:
      "A permanent identifier, a signed record of what an agent may do, and the person who answers for it.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${poppins.variable} ${instrumentSerif.variable}`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
