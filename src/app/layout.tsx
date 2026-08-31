import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Poppins } from "next/font/google";

import { SITE_ORIGIN } from "@/lib/brand/site-origin";
import { CookieNotice } from "@/lib/cookie-notice";

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

// The public landing page's pair. Self-hosted at build time for the same
// reason as Poppins above — the mockup links them from fonts.googleapis.com,
// which is the one thing from it that cannot be copied over.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  applicationName: "AIN Registry",
  title: {
    // Applies to every authenticated route, none of which sets its own title.
    // The landing page overrides it absolutely — see `page.tsx`.
    default: "AIN Registry · Subra",
    template: "%s · Subra",
  },
  description:
    "Every action an agent takes is bound to the scope it was authorised under, and to the role that answers for it. Beta for UK regulated firms.",
  // Icons are file-based — `icon.svg`, `apple-icon.png` and `favicon.ico`
  // beside this file. Next emits the tags from those, so there is no path
  // here to drift out of step with what is actually on disk. The SVG carries
  // its own dark-mode swap; the PNGs bake the light face, which is what a
  // home screen and a bookmark bar show.
  // Each route is canonical to itself. Relative, so it resolves against
  // `metadataBase` per page rather than pointing everything at the root.
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: "AIN Registry",
    locale: "en_GB",
    title: "Subra: The accountability register for autonomous agents",
    description:
      "Every action an agent takes is bound to the scope it was authorised under, and to the role that answers for it. Beta for UK regulated firms.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Subra: The accountability register for autonomous agents",
    description:
      "Every action an agent takes is bound to the scope it was authorised under, and to the role that answers for it. Beta for UK regulated firms.",
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
      className={`h-full antialiased ${poppins.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <CookieNotice />
      </body>
    </html>
  );
}
