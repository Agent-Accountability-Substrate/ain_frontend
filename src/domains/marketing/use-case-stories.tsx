import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";

import { RevealHeading } from "@/domains/marketing/reveal";

const AUDIENCES = [
  "Compliance and AI governance",
  "Operational and enterprise risk",
  "Internal audit",
  "Model risk management",
  "Security and identity architecture",
  "Agent infrastructure leaders",
] as const;

const ADJACENT_ICPS = [
  {
    number: "A",
    title: "Call agents",
    description:
      "Keep evidence of what was said, which policy applied and when a customer request was escalated.",
  },
  {
    number: "B",
    title: "Chat agents",
    description:
      "Bind customer messages and completed actions to the identity, scope and model version presented.",
  },
  {
    number: "C",
    title: "Operations agents",
    description:
      "Record internal approvals, case routing, account changes and vendor reviews with accountable context.",
  },
] as const;

const STORIES = [
  {
    number: "01",
    title: "Payments and refunds",
    action: "An agent initiates a refund or payment.",
    risk: "Incorrect or unauthorised transfer.",
    owner: "Operations",
    evidence:
      "Signed receipt showing the scope result and amount against declared limits.",
  },
  {
    number: "02",
    title: "Lending and underwriting operations",
    action: "An agent updates or recommends within an underwriting workflow.",
    risk: "Decision made outside authorised parameters.",
    owner: "Credit Risk",
    evidence: "Receipt binding the decision to the policy version in force.",
  },
  {
    number: "03",
    title: "Insurance claims",
    action: "An agent processes or escalates a claim.",
    risk: "Inconsistent or unauthorised claims handling.",
    owner: "Claims Operations",
    evidence: "Receipt and evidence package for claims audit review.",
  },
] as const;

export function UseCaseStories() {
  return (
    <section
      id="use-cases"
      className="use-cases-section relative scroll-mt-24 overflow-hidden py-[clamp(76px,9vw,132px)]"
    >
      <div className="use-cases-field" aria-hidden="true" />

      <div className="relative z-[1] mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="use-cases-intro">
          <div>
            <p className="font-site-mono text-[11px] font-semibold uppercase tracking-[0.17em] text-site-accent">
              Where this applies
            </p>
            <RevealHeading
              lead="Built for organisations where an agent's action"
              accent="carries a consequence."
              className="mt-5 max-w-[20ch] text-[clamp(36px,4.8vw,58px)] leading-[1.04] font-medium tracking-[-0.04em] text-site-ink"
            />
          </div>

          <p>
            Three examples of the high-stakes workflows Subra is designed for,
            organised by the action taken, not by industry vertical.
          </p>
        </div>

        <aside
          className="use-cases-audience"
          aria-labelledby="audience-heading"
        >
          <div>
            <span>Primary ICP</span>
            <h3 id="audience-heading">
              Regulated organisations deploying consequential AI agents
            </h3>
          </div>
          <ul>
            {AUDIENCES.map((audience) => (
              <li key={audience}>
                <CheckCircle2 aria-hidden="true" />
                {audience}
              </li>
            ))}
          </ul>
        </aside>

        <ol className="use-cases-ledger" aria-label="Use-case stories">
          {STORIES.map((story) => (
            <li key={story.number}>
              <div className="use-case-identity">
                <span>{story.number}</span>
                <h3>{story.title}</h3>
                <ArrowRight aria-hidden="true" />
              </div>

              <dl className="use-case-facts">
                <div>
                  <dt>
                    <ArrowRight aria-hidden="true" /> Action
                  </dt>
                  <dd>{story.action}</dd>
                </div>
                <div>
                  <dt>
                    <ShieldAlert aria-hidden="true" /> Risk
                  </dt>
                  <dd>{story.risk}</dd>
                </div>
                <div>
                  <dt>
                    <UserRoundCheck aria-hidden="true" /> Accountable function
                  </dt>
                  <dd>{story.owner}</dd>
                </div>
                <div className="use-case-evidence">
                  <dt>
                    <FileCheck2 aria-hidden="true" /> Evidence produced
                  </dt>
                  <dd>{story.evidence}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>

        <aside
          className="use-cases-adjacent"
          aria-labelledby="adjacent-icp-heading"
        >
          <div className="use-cases-adjacent-heading">
            <span>Other agent teams</span>
            <h3 id="adjacent-icp-heading">
              The same evidence model applies wherever agents communicate or act
            </h3>
          </div>
          <ol>
            {ADJACENT_ICPS.map((icp) => (
              <li key={icp.number}>
                <span>{icp.number}</span>
                <strong>{icp.title}</strong>
                <p>{icp.description}</p>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
