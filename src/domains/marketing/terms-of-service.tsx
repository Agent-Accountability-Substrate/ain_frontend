import { PublicInformationPage } from "@/domains/marketing/public-information-page";

const SECTIONS = [
  {
    title: "About these terms",
    body: "These terms govern your use of the Subra website and any private-preview materials made available through it. Additional written terms may apply to a pilot, evaluation or paid service and will take priority where they conflict with these website terms.",
  },
  {
    title: "Using the website",
    body: "You may use the website to learn about Subra and contact us about the private preview. You must not interfere with the website, attempt unauthorised access, introduce malicious code, misuse forms or use the service in a way that infringes another person's rights.",
  },
  {
    title: "Private preview",
    body: "A request does not guarantee access. Preview features, documentation and availability may change as the product develops. We may limit, suspend or end preview access where necessary for security, misuse prevention or product operation.",
  },
  {
    title: "Evidence and decisions",
    body: "Subra provides evidence and accountability tooling. It does not provide legal advice, certify compliance, grant regulatory approval or make an organisation's authorisation and enforcement decisions. You remain responsible for how your organisation interprets and uses any output.",
  },
  {
    title: "Intellectual property",
    body: "The website, product interfaces, documentation, branding and related materials are owned by Subra or its licensors. These terms do not transfer ownership. You may not copy or redistribute protected materials except where law permits or we agree in writing.",
  },
  {
    title: "Availability and liability",
    body: "We aim to keep public information accurate and the website available, but we do not promise uninterrupted access or that every item will always be complete or current. Nothing in these terms excludes liability that cannot lawfully be excluded. Any separate service agreement will state the terms that apply to that service.",
  },
  {
    title: "Changes to these terms",
    body: "We may update these terms when the website, product or legal requirements change. The effective date on this page identifies the current version. Continued use after an update means the revised terms apply from that point.",
  },
] as const;

export function TermsOfService() {
  return (
    <PublicInformationPage
      eyebrow="Legal"
      title="Terms of Service"
      effectiveDate="31 August 2026"
      introduction="These terms explain the conditions for using the Subra website and requesting access to the private preview. Please read them before using the site or submitting a request."
      sections={SECTIONS}
      contactHeading="Questions about these terms"
      contactBody="Contact us if you need clarification about how these terms apply to the website or a private-preview conversation."
    />
  );
}
