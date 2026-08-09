"use client";

import { useEffect, useState } from "react";

const PROOF_WORDS = [
  "accountable.",
  "authorised.",
  "traceable.",
  "verifiable.",
] as const;

export function HeroRotatingProofWord() {
  const [displayedWord, setDisplayedWord] = useState<string>(PROOF_WORDS[0]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let wordIndex = 0;
    let characterIndex = PROOF_WORDS[0].length;
    let deleting = false;

    const clearTimer = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
    };

    const schedule = (delay: number) => {
      clearTimer();
      timer = setTimeout(tick, delay);
    };

    const tick = () => {
      const word = PROOF_WORDS[wordIndex]!;

      if (deleting) {
        if (characterIndex > 0) {
          characterIndex -= 1;
          setDisplayedWord(word.slice(0, characterIndex));
          schedule(48);
          return;
        }

        wordIndex = (wordIndex + 1) % PROOF_WORDS.length;
        deleting = false;
        schedule(260);
        return;
      }

      const nextWord = PROOF_WORDS[wordIndex]!;

      if (characterIndex < nextWord.length) {
        characterIndex += 1;
        setDisplayedWord(nextWord.slice(0, characterIndex));
        schedule(88);
        return;
      }

      deleting = true;
      schedule(1350);
    };

    const syncMotionPreference = () => {
      clearTimer();
      wordIndex = 0;
      characterIndex = PROOF_WORDS[0].length;
      deleting = !reducedMotion.matches;
      setDisplayedWord(PROOF_WORDS[0]);

      if (!reducedMotion.matches) {
        schedule(1350);
      }
    };

    reducedMotion.addEventListener("change", syncMotionPreference);
    syncMotionPreference();

    return () => {
      clearTimer();
      reducedMotion.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  return (
    <>
      <span
        className="hero-proof-word"
        data-testid="hero-proof-word"
        data-words={PROOF_WORDS.join(",")}
        aria-hidden="true"
      >
        <span className="hero-proof-word-text">{displayedWord}</span>
        <span className="hero-proof-word-caret" />
      </span>
      <span className="sr-only">accountable</span>
    </>
  );
}
