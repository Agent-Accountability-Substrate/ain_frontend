// Native <details>: keyboard behaviour, screen-reader semantics and
// find-in-page all work without hydration, and a closed answer stays in the
// DOM for anyone printing the page. The shared `name` makes the set exclusive
// where it is supported and independent toggles where it is not.
const QUESTIONS = [
  {
    question: "Does the check slow the agent down?",
    answer:
      "It is a lookup against the scope in force, not an inference call. The register returns a decision and records the authority the decision relied on.",
  },
  {
    question: "Is it a record or a control?",
    answer:
      "A record that answers in real time. It says whether an action is inside the authorised scope and keeps that answer; blocking the action stays your runtime's job.",
  },
  {
    question: "What happens when the person in the role leaves?",
    answer:
      "The record binds a role and its regulatory identifier, so the successor inherits it with an effective date. Every prior version keeps the identifier that was accountable at the time.",
  },
  {
    question: "What does it hold about our customers?",
    answer:
      "The record of authority, not the customer data an agent touches. Your runtime logs are referenced by pointer and never ingested, and no other firm can read your records.",
  },
] as const;

export function LandingFaq() {
  return (
    <section className="border-t border-line bg-band">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-32 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
          <div>
            <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-secondary">
              Questions
            </p>
            <h2 className="mt-6 max-w-[20ch] text-balance text-[32px] font-normal leading-[1.06] tracking-[-0.03em] text-ink sm:text-[42px] lg:text-[46px]">
              What firms ask first.
            </h2>
          </div>

          <div className="border-t border-line-strong">
            {QUESTIONS.map((item) => (
              <details
                key={item.question}
                name="landing-faq"
                className="border-b border-line"
              >
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-6 text-[17px] leading-snug text-ink outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                  {item.question}

                  {/* Two rules: the upright hides on open, so a plus becomes a
                      minus without anything rotating. */}
                  <span
                    aria-hidden="true"
                    className="relative mt-2 h-[13px] w-[13px] shrink-0"
                  >
                    <span className="absolute left-0 top-[6px] h-px w-[13px] bg-ink-muted" />
                    <span className="faq-mark-vertical absolute left-[6px] top-0 h-[13px] w-px bg-ink-muted" />
                  </span>
                </summary>

                <p className="faq-answer max-w-[52ch] pb-7 text-[15px] leading-7 text-slate-700">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
