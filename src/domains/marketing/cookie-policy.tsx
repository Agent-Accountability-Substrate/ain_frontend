import { PublicInformationPage } from "@/domains/marketing/public-information-page";

const SECTIONS = [
  {
    title: "What cookies are",
    body: "Cookies are small text files stored by a browser. They can keep a service secure, remember a session or help a site understand how it is used. Similar technologies may perform related functions.",
  },
  {
    title: "Cookies on the public website",
    body: "The Subra public marketing pages do not intentionally use analytics, advertising or personalisation cookies. We do not use cookies on those pages to build advertising profiles or track visitors across unrelated websites.",
  },
  {
    title: "Essential authentication cookies",
    body: "If you choose to sign in, the authentication flow uses strictly necessary cookies to protect the sign-in attempt and maintain a secure session. These cookies support security and account access and are not used for advertising.",
  },
  {
    title: "The notice you saw on arrival",
    body: "Because the site sets no optional cookies, the notice on your first visit informs rather than asks for consent. Dismissing it records that choice in your browser's local storage so the notice does not return; that record stays on your device, is readable only by this site, and is cleared whenever you clear site data.",
  },
  {
    title: "Your browser controls",
    body: "Most browsers let you inspect, block or delete cookies. Blocking essential authentication cookies may prevent sign-in or cause an authenticated session to stop working. The public information pages remain available without signing in.",
  },
  {
    title: "Changes to this policy",
    body: "We will update this policy if our use of cookies changes. If optional analytics or advertising cookies are introduced, we will provide the notices and choices required before using them.",
  },
] as const;

export function CookiePolicy() {
  return (
    <PublicInformationPage
      eyebrow="Legal"
      title="Cookie Policy"
      effectiveDate="31 August 2026"
      introduction="This policy explains when the Subra website uses cookies and similar storage, and what choices are available to you. The current public site uses only the cookies needed when a visitor chooses to enter the authenticated product."
      sections={SECTIONS}
      contactHeading="Questions about cookies"
      contactBody="Contact us if you want to understand how cookies are used on the public website or during sign-in."
    />
  );
}
