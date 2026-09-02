import { PublicInformationPage } from "@/domains/marketing/public-information-page";

const SECTIONS = [
  {
    title: "The problem we are focused on",
    body: "AI-agent identity, authority, policy versions, accountable ownership and runtime activity often live in different systems. When an action has to be explained later, risk and audit teams are left assembling that story manually.",
  },
  {
    title: "What Subra contributes",
    body: "Subra sits alongside existing identity and control systems. It connects each completed action to the identity presented, the accountable context and the versions in force, then produces signed evidence that can be checked independently later.",
  },
  {
    title: "Who we are building for",
    body: "Our initial focus is regulated organisations deploying AI agents in workflows where an action carries operational, financial or customer impact. We work across compliance, risk, audit, identity and agent-platform teams.",
  },
  {
    title: "Our boundary",
    body: "Subra records and verifies evidence. It does not replace IAM, orchestrate agents, become a runtime gateway, make an enforcement decision or certify regulatory compliance.",
  },
] as const;

export function AboutSubra() {
  return (
    <PublicInformationPage
      eyebrow="Company"
      title="About Subra"
      introduction="Subra is building evidence and accountability infrastructure for AI-agent actions that need to remain explainable after the event."
      sections={SECTIONS}
      contactHeading="Work with us"
      contactBody="Tell us about the agent workflow, accountability question or evidence gap your organisation is working through."
    />
  );
}
