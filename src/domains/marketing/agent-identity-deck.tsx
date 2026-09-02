"use client";

import type { CSSProperties, PointerEvent, TouchEvent } from "react";
import { Bot, Fingerprint } from "lucide-react";
import { useRef, useState } from "react";

import { CopyableAin } from "@/domains/agents/copyable-ain";

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
type TouchOrigin = {
  identifier: number;
  x: number;
  y: number;
};

const TAP_MOVEMENT_TOLERANCE = 12;

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

  if (event.pointerType !== "mouse" || card.dataset.position !== "active") {
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
  const touchOriginRef = useRef<TouchOrigin | null>(null);
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

  const beginCardTouch = (event: TouchEvent<HTMLButtonElement>) => {
    if (event.touches.length !== 1) {
      touchOriginRef.current = null;
      return;
    }

    const touch = event.touches[0]!;
    touchOriginRef.current = {
      identifier: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const cancelCardTouch = () => {
    touchOriginRef.current = null;
  };

  const completeCardTouch = (
    event: TouchEvent<HTMLButtonElement>,
    activate: () => void,
  ) => {
    const origin = touchOriginRef.current;
    touchOriginRef.current = null;

    if (!origin) {
      return;
    }

    const touch = Array.from(event.changedTouches).find(
      (changedTouch) => changedTouch.identifier === origin.identifier,
    );

    if (
      !touch ||
      Math.abs(touch.clientX - origin.x) > TAP_MOVEMENT_TOLERANCE ||
      Math.abs(touch.clientY - origin.y) > TAP_MOVEMENT_TOLERANCE
    ) {
      return;
    }

    // Mobile Safari can consume the first tap as hover/focus on transformed
    // elements. Handle a deliberate tap directly and suppress its delayed
    // compatibility click so the card changes state exactly once.
    event.preventDefault();
    activate();
  };

  return (
    <div
      className="agent-tablet-frame mx-auto mt-16 w-full max-w-6xl"
      data-testid="agent-tablet-frame"
    >
      <span className="agent-tablet-camera" aria-hidden="true" />
      <section
        aria-labelledby="agent-identity-deck-title"
        className="agent-tablet-screen flex flex-col items-center overflow-hidden bg-transparent px-5 py-10 text-white sm:px-8 sm:py-14 lg:px-12"
      >
        <div className="relative z-40 order-2 mt-8 max-w-2xl border-t border-white/10 pt-9 text-center sm:mt-10 sm:pt-11">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-[#DCE5F8]">
            <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
            Subra
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
            Move through signed identity records for operational agents. Each
            card keeps ownership, declared scope and a permanent AIN bound
            together.
          </p>
        </div>

        <div className="relative order-1 w-full max-w-2xl min-w-0">
          <p className="sr-only" aria-live="polite">
            {activeAgent.name} selected
          </p>

          <div
            className="agent-deck-stage"
            aria-label="Agent identity passport cards"
          >
            {AGENT_RECORDS.map((agent, index) => {
              const position = getDeckPosition(index, activeIndex);
              const isActive = position === "active";
              const isFlipped = flippedIndex === index;
              const activateFront = isActive
                ? toggleActiveCard
                : () => selectAgent(index);
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
                  onPointerCancel={resetPointerEffect}
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
                        <span>Subra</span>
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

                      <button
                        type="button"
                        onClick={activateFront}
                        onTouchStart={beginCardTouch}
                        onTouchEnd={(event) =>
                          completeCardTouch(event, activateFront)
                        }
                        onTouchCancel={cancelCardTouch}
                        className="agent-card-face-click"
                        aria-label={
                          isActive
                            ? `View registered record for ${agent.name}`
                            : `Show ${agent.name}`
                        }
                      />
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
                          <p>Subra</p>
                          <h3>Agent accountability passport</h3>
                        </div>
                      </header>

                      <div className="agent-card-record-agent">
                        <div>
                          <p>Registered agent</p>
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
                          <dt>Record version</dt>
                          <dd>{agent.documentVersion}</dd>
                        </div>
                        <div>
                          <dt>Signing algorithm</dt>
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
                          <dt>Verified at</dt>
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

                      <button
                        type="button"
                        onClick={toggleActiveCard}
                        onTouchStart={beginCardTouch}
                        onTouchEnd={(event) =>
                          completeCardTouch(event, toggleActiveCard)
                        }
                        onTouchCancel={cancelCardTouch}
                        className="agent-card-face-click"
                        aria-label={`Show identity card for ${agent.name}`}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
