import { Reveal, RevealHeading } from "@/domains/marketing/reveal";

const EVIDENCE_FRAGMENTS = [
  {
    key: "identity",
    label: "Identity",
    description: "Held by IAM or an agent protocol.",
  },
  {
    key: "authority",
    label: "Authority",
    description: "Stored in policies and approval records.",
  },
  {
    key: "versions",
    label: "Versions",
    description: "Model and policy versions change over time.",
  },
  {
    key: "accountability",
    label: "Accountability",
    description: "Often a role maintained in a spreadsheet.",
  },
  {
    key: "activity",
    label: "Activity",
    description:
      "Logs show what happened, but may not prove the authority relied upon.",
  },
] as const;

const EVIDENCE_SIGNAL_PATHS = [
  {
    key: "identity",
    path: "M785 120 C760 92 746 56 700 56 H382 C350 56 350 112 328 112 H288",
  },
  {
    key: "authority",
    path: "M785 235 H569",
  },
  {
    key: "versions",
    path: "M785 360 C760 392 746 438 700 438 H382 C350 438 350 358 328 358 H288",
  },
  {
    key: "accountability",
    path: "M785 160 C785 132 778 112 756 112",
  },
  {
    key: "activity",
    path: "M785 310 C785 332 778 358 756 358",
  },
] as const;

type EvidenceFragmentKey = (typeof EVIDENCE_FRAGMENTS)[number]["key"];

function EvidenceFragmentMark({ type }: { type: EvidenceFragmentKey }) {
  if (type === "identity") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M13 26c0-8 4.5-13 11-13s11 5 11 13" />
        <path d="M17 28c0-6.1 2.8-10 7-10s7 3.9 7 10c0 5.8-1.7 9.2-4.2 12" />
        <path d="M21 29c0-3.9 1.1-6 3-6s3 2.1 3 6c0 4.8-1.3 7.8-3.3 10" />
      </svg>
    );
  }

  if (type === "authority") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="13" />
        <path d="m18.5 24.5 3.6 3.6 7.8-8.2" />
        <path d="M24 7v4M24 37v4M7 24h4M37 24h4" />
      </svg>
    );
  }

  if (type === "versions") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="m11 18 13-7 13 7-13 7-13-7Z" />
        <path d="m11 24 13 7 13-7M11 30l13 7 13-7" />
      </svg>
    );
  }

  if (type === "accountability") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="17" r="5" />
        <path d="M14 37c.8-7.2 4.2-11 10-11s9.2 3.8 10 11" />
        <path d="M9 11h6M33 11h6M9 37h6M33 37h6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M7 25h8l3-9 6 18 4-13 3 4h10" />
      <circle cx="41" cy="25" r="2" />
    </svg>
  );
}

export function BuyerProblem() {
  return (
    <section
      id="problem"
      className="scroll-mt-24 border-t border-site-rule bg-site-paper py-[clamp(72px,9vw,132px)]"
    >
      <div className="mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="grid items-start gap-x-[clamp(32px,6vw,92px)] gap-y-0 [grid-template-columns:minmax(0,0.72fr)_minmax(0,1.28fr)] max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:gap-y-8">
          <div className="buyer-problem-label inline-flex items-center gap-3 font-site-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-site-accent">
            <span
              className="h-2 w-2 rounded-full bg-site-accent shadow-[0_0_0_5px_rgba(240,128,60,0.1)]"
              aria-hidden="true"
            />
            The problem
          </div>

          <div className="buyer-problem-intro">
            <RevealHeading
              lead="When an agent action has to be explained,"
              accent="the evidence is rarely in one place."
              className="max-w-[18ch] text-[clamp(34px,5.2vw,62px)] leading-[1.04] font-medium tracking-[-0.038em] text-site-ink"
            />
            <p className="mt-7 max-w-[62ch] text-[17px] leading-[1.7] text-site-ink-soft">
              Identity, authority, ownership, policy and model versions often
              live in different systems. Runtime logs show what happened, but
              not always what the agent was authorised to do.
            </p>
          </div>

          <aside
            className="buyer-problem-preview"
            aria-label="Illustrative evidence review interface"
          >
            <header>
              <div>
                <span>Evidence signal</span>
                <strong>Evidence review</strong>
              </div>
              <i aria-hidden="true" />
            </header>

            <div className="buyer-problem-preview-case">
              <span>Action under review</span>
              <code>act_24A7</code>
            </div>

            <div className="buyer-problem-preview-status">
              <span>Evidence located</span>
              <strong>2 of 5 fragments</strong>
              <div aria-hidden="true">
                <i data-found="true" />
                <i data-found="true" />
                <i />
                <i />
                <i />
              </div>
            </div>

            <dl>
              <div>
                <dt>Identity</dt>
                <dd data-state="found">Located</dd>
              </div>
              <div>
                <dt>Authority</dt>
                <dd data-state="missing">Not linked</dd>
              </div>
              <div>
                <dt>Policy version</dt>
                <dd data-state="missing">Unresolved</dd>
              </div>
            </dl>

            <p>
              <span aria-hidden="true" />
              Manual reconstruction required
            </p>
          </aside>
        </div>

        <Reveal className="buyer-problem-map" as="div">
          <svg
            className="buyer-problem-paths"
            viewBox="0 0 1200 470"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {EVIDENCE_SIGNAL_PATHS.map((signal) => (
              <path
                key={signal.key}
                id={`buyer-problem-path-${signal.key}`}
                data-signal={signal.key}
                d={signal.path}
              />
            ))}

            {EVIDENCE_SIGNAL_PATHS.map((signal, index) => (
              <g
                key={signal.key}
                className="buyer-problem-signal-dot"
                data-signal={signal.key}
              >
                <circle className="buyer-problem-signal-halo" r="7" />
                <circle className="buyer-problem-signal-core" r="3.5" />
                <animateMotion
                  begin={`${index * 2}s`}
                  calcMode="linear"
                  dur="10s"
                  keyPoints="0;1;1"
                  keyTimes="0;0.18;1"
                  repeatCount="indefinite"
                >
                  <mpath href={`#buyer-problem-path-${signal.key}`} />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  begin={`${index * 2}s`}
                  dur="10s"
                  keyTimes="0;0.02;0.15;0.18;1"
                  repeatCount="indefinite"
                  values="0;1;1;0;0"
                />
              </g>
            ))}
          </svg>

          <ol
            className="buyer-problem-fragments"
            aria-label="Fragmented evidence sources"
          >
            {EVIDENCE_FRAGMENTS.map((fragment, index) => (
              <li
                key={fragment.key}
                className="buyer-problem-fragment"
                data-fragment={fragment.key}
              >
                <div className="buyer-problem-mark">
                  <EvidenceFragmentMark type={fragment.key} />
                  <span className="buyer-problem-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div>
                  <h3>{fragment.label}</h3>
                  <p>{fragment.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="buyer-problem-question">
            <span>The unanswered question</span>
            <h3>
              Who acted, under whose authority, using which policy and model
              version?
            </h3>
            <p>
              Audit teams assemble these fragments manually after the event.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
