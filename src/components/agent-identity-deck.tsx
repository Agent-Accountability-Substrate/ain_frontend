"use client";

import type { CSSProperties, PointerEvent } from "react";
import { Bot, Fingerprint, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { CopyableAin } from "@/components/copyable-ain";

const AGENT_RECORDS = [
  {
    name: "Payments Operations Agent",
    owner: "Payments Operations",
    permanentAin:
      "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ",
    displayAin: "did:ain:gb:01ARZ3N…EMMVRZ",
    shortAin: "01AR Z3ND EKTS V4RR",
    documentVersion: "v3",
    signature: "EdDSA",
    keyId: "key-demo-7F3A91C2",
    lastVerified: "23 Jul 2026, 11:42 BST",
    scopes: ["payments.initiate", "customer_comms.send"],
    accent: "#76A2FF",
    accentSoft: "#B8CAFF",
  },
  {
    name: "Customer Communications Agent",
    owner: "Customer Experience",
    permanentAin:
      "did:ain:gb:01CS8JH4Q2YM6N7PVK3TD9W0AX:01D4M8ZR6KS2VQ9JH7T3NF5BWC",
    displayAin: "did:ain:gb:01CS8JH4Q…NF5BWC",
    shortAin: "01CS 8JH4 Q2YM 6N7P",
    documentVersion: "v2",
    signature: "EdDSA",
    keyId: "key-demo-2D8C44A1",
    lastVerified: "23 Jul 2026, 11:38 BST",
    scopes: ["customer_comms.send", "cases.read"],
    accent: "#74D6A2",
    accentSoft: "#B9F4D3",
  },
  {
    name: "Vendor Risk Review Agent",
    owner: "Risk & Assurance",
    permanentAin:
      "did:ain:gb:01VR7QPA19DM8K2L5X4CN6SBEF:01R9T3WY8KU2M5H7DA4P6ZVQJC",
    displayAin: "did:ain:gb:01VR7QPA1…P6ZVQJC",
    shortAin: "01VR 7QPA 19DM 8K2L",
    documentVersion: "v4",
    signature: "EdDSA",
    keyId: "key-demo-91BA6E30",
    lastVerified: "23 Jul 2026, 11:31 BST",
    scopes: ["vendor_risk.review", "evidence.read"],
    accent: "#B6A2FF",
    accentSoft: "#DDD4FF",
  },
] as const;

type DeckPosition = "active" | "next" | "previous";

function getDeckPosition(index: number, activeIndex: number): DeckPosition {
  const relativeIndex =
    (index - activeIndex + AGENT_RECORDS.length) % AGENT_RECORDS.length;

  if (relativeIndex === 0) {
    return "active";
  }

  return relativeIndex === 1 ? "next" : "previous";
}

function handlePointerMove(event: PointerEvent<HTMLElement>) {
  const card = event.currentTarget;

  if (card.dataset.position !== "active") {
    return;
  }

  const bounds = card.getBoundingClientRect();
  const pointerX = (event.clientX - bounds.left) / bounds.width;
  const pointerY = (event.clientY - bounds.top) / bounds.height;

  card.style.setProperty("--glow-x", `${pointerX * 100}%`);
  card.style.setProperty("--glow-y", `${pointerY * 100}%`);
}

function resetPointerEffect(event: PointerEvent<HTMLElement>) {
  const card = event.currentTarget;

  card.style.setProperty("--glow-x", "50%");
  card.style.setProperty("--glow-y", "34%");
}

export function AgentIdentityDeck() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const activeAgent = AGENT_RECORDS[activeIndex]!;

  const selectAgent = (index: number) => {
    setActiveIndex(index);
    setFlippedIndex(null);
  };

  const toggleActiveCard = () => {
    setFlippedIndex((currentIndex) =>
      currentIndex === activeIndex ? null : activeIndex,
    );
  };

  return (
    <section
      aria-labelledby="agent-identity-deck-title"
      className="mx-auto mt-16 max-w-6xl overflow-hidden rounded-[32px] border border-[#D8DDE8] bg-[#091126] px-5 py-10 text-white shadow-[0_32px_90px_-52px_rgba(9,17,38,0.8)] sm:px-8 sm:py-14 lg:grid lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)] lg:items-center lg:gap-6 lg:px-12"
    >
      <div className="relative z-40 max-w-lg">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-[#DCE5F8]">
          <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
          Illustrative demo data
        </div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.24em] text-[#8FA8D5]">
          Portable agent identity
        </p>
        <h2
          id="agent-identity-deck-title"
          className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          One registry. A distinct passport for every agent.
        </h2>
        <p className="mt-5 text-sm leading-7 text-[#C8D3E8] sm:text-base">
          Move through signed identity records for operational agents. Each card
          keeps ownership, declared scope and a permanent AIN bound together.
        </p>
        <div className="mt-7 flex items-start gap-3 border-t border-white/10 pt-6">
          <ShieldCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-[#74D6A2]"
            aria-hidden="true"
          />
          <p className="text-sm leading-6 text-[#DCE5F8]">
            Click any card to bring it forward. Click the active card again to
            flip it and inspect the complete registered-agent record.
          </p>
        </div>
      </div>

      <div className="relative mt-8 min-w-0 lg:mt-0">
        <p className="sr-only" aria-live="polite">
          {activeAgent.name} selected
        </p>

        <div
          className="agent-deck-stage"
          aria-label="Illustrative agent identity cards"
        >
          {AGENT_RECORDS.map((agent, index) => {
            const position = getDeckPosition(index, activeIndex);
            const isActive = position === "active";
            const isFlipped = flippedIndex === index;
            const cardStyle = {
              "--agent-accent": agent.accent,
              "--agent-accent-soft": agent.accentSoft,
            } as CSSProperties;

            return (
              <article
                key={agent.permanentAin}
                className="agent-deck-card"
                data-position={position}
                data-flipped={isFlipped}
                aria-label={`${agent.name} identity card`}
                aria-current={isActive ? "true" : undefined}
                onPointerMove={handlePointerMove}
                onPointerLeave={resetPointerEffect}
                style={cardStyle}
              >
                <div className="agent-card-flipper">
                    <div
                      className="agent-card-face agent-card-front"
                      aria-hidden={isFlipped}
                    >
                      <span className="agent-card-grid" aria-hidden="true" />
                      <span
                        className="agent-card-biometric"
                        aria-hidden="true"
                      />
                      <span className="agent-card-scan" aria-hidden="true" />
                      <span className="agent-card-light" aria-hidden="true" />

                      <span className="agent-card-brand">
                        <span className="agent-card-brand-mark">
                          <Fingerprint aria-hidden="true" />
                        </span>
                        <span>AIN Registry</span>
                      </span>

                      <span className="agent-card-visual" aria-hidden="true">
                        <span className="agent-card-orbit agent-card-orbit-outer" />
                        <span className="agent-card-orbit agent-card-orbit-inner" />
                        <span className="agent-card-core">
                          <Bot />
                        </span>
                        <span className="agent-card-node agent-card-node-one" />
                        <span className="agent-card-node agent-card-node-two" />
                        <span className="agent-card-node agent-card-node-three" />
                      </span>

                      <div className="agent-card-details">
                        <span className="agent-card-status">
                          <span aria-hidden="true" />
                          Lifecycle active
                        </span>
                        <span className="agent-card-name">{agent.name}</span>
                        <span className="agent-card-rule" aria-hidden="true" />
                        <span className="agent-card-label">
                          Accountable owner
                        </span>
                        <span className="agent-card-owner">{agent.owner}</span>
                        <span className="agent-card-scope">
                          {agent.scopes[0]}
                        </span>
                        <span className="agent-card-label">Permanent AIN</span>
                        <span className="agent-card-ain">{agent.shortAin}</span>
                      </div>

                      <span className="agent-card-seal" aria-hidden="true">
                        <Fingerprint />
                      </span>
                      <span className="agent-card-edge" aria-hidden="true" />

                      {!isFlipped ? (
                        <button
                          type="button"
                          onClick={
                            isActive
                              ? toggleActiveCard
                              : () => selectAgent(index)
                          }
                          className="agent-card-face-click"
                          aria-label={
                            isActive
                              ? `View registered record for ${agent.name}`
                              : `Show ${agent.name}`
                          }
                        />
                      ) : null}
                    </div>

                    <div
                      className="agent-card-face agent-card-back"
                      aria-hidden={!isFlipped}
                    >
                      <span
                        className="agent-card-record-biometric"
                        aria-hidden="true"
                      />
                      <header className="agent-card-record-header">
                        <div>
                          <p>Registered agent record</p>
                          <h3>Agent accountability passport</h3>
                        </div>
                        <span>Illustrative demo data</span>
                      </header>

                      <div className="agent-card-record-agent">
                        <div>
                          <p>Agent</p>
                          <strong>{agent.name}</strong>
                        </div>
                        <span>
                          <i aria-hidden="true" />
                          Active
                        </span>
                      </div>

                      <div className="agent-card-record-ain">
                        <p>Permanent AIN</p>
                        <div>
                          <code title={agent.permanentAin}>
                            <span className="sr-only">
                              {agent.permanentAin}
                            </span>
                            <span aria-hidden="true">{agent.displayAin}</span>
                          </code>
                          {isActive && isFlipped ? (
                            <span className="agent-card-record-copy">
                              <CopyableAin value={agent.permanentAin} />
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <dl className="agent-card-record-details">
                        <div>
                          <dt>Document version</dt>
                          <dd>{agent.documentVersion}</dd>
                        </div>
                        <div>
                          <dt>Signature</dt>
                          <dd>{agent.signature}</dd>
                        </div>
                        <div>
                          <dt>Key ID</dt>
                          <dd className="agent-card-record-mono">
                            {agent.keyId}
                          </dd>
                        </div>
                        <div>
                          <dt>Accountable owner</dt>
                          <dd>{agent.owner}</dd>
                        </div>
                        <div className="agent-card-record-wide">
                          <dt>Last verified</dt>
                          <dd>{agent.lastVerified}</dd>
                        </div>
                      </dl>

                      <div className="agent-card-record-scope">
                        <p>Scope</p>
                        <ul aria-label={`${agent.name} scope`}>
                          {agent.scopes.map((scope) => (
                            <li key={scope}>{scope}</li>
                          ))}
                        </ul>
                      </div>

                      {isActive && isFlipped ? (
                        <button
                          type="button"
                          onClick={toggleActiveCard}
                          className="agent-card-face-click"
                          aria-label={`Show identity card for ${agent.name}`}
                        />
                      ) : null}
                    </div>
                  </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
