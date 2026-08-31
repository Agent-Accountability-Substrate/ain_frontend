import { PublicInformationPage } from "@/domains/marketing/public-information-page";

const SECTIONS = [
  {
    title: "What we collect",
    body: "When you request the private preview, we collect your name, work email address, organisation, role and any agent-workflow context you choose to provide. We also process limited technical information needed to protect the form from abuse.",
  },
  {
    title: "Why we use it",
    body: "We use this information to assess and respond to your request, understand whether the preview is relevant to your organisation, arrange follow-up conversations and protect the service from misuse. We do not use the form submission to make automated decisions about you.",
  },
  {
    title: "Who receives it",
    body: "Access is limited to the Subra team and service providers that support hosting, security and email delivery. We do not sell the personal data submitted through this form.",
  },
  {
    title: "How long we keep it",
    body: "We keep preview-request information only for as long as it is reasonably needed to handle the conversation, maintain an appropriate business record and meet legal or security obligations.",
  },
  {
    title: "Your choices and rights",
    body: "You may ask us to access, correct or delete your personal data, or object to or restrict certain processing. You may also raise a concern with the data-protection authority that applies where you live or work.",
  },
] as const;

export function PrivacyNotice() {
  return (
    <PublicInformationPage
      eyebrow="Legal"
      title="Privacy Notice"
      effectiveDate="31 August 2026"
      introduction="Subra is the controller for personal data submitted through this website. This notice explains how we handle that data, including information provided when you request access to the private preview."
      sections={SECTIONS}
      contactHeading="Questions about your data"
      contactBody="Contact us to exercise a data-protection right or ask how this notice applies to your information."
    />
  );
}
