"use client";

import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { AccessRequestForm } from "@/domains/marketing/access-request-form";
import { RevealHeading } from "@/domains/marketing/reveal";

/**
 * The landing page's closing section: the stage the request sits on. The
 * request itself is `AccessRequestForm`, which the end of a post renders too.
 */
export function AccessForm() {
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof window.matchMedia !== "function") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame: number | undefined;

    const reset = () => {
      stage.style.setProperty("--preview-x", "0");
      stage.style.setProperty("--preview-y", "0");
      stage.style.setProperty("--preview-scroll", "0");
    };

    const updateScrollDepth = () => {
      animationFrame = undefined;
      if (reducedMotion.matches) {
        reset();
        return;
      }

      const rect = stage.getBoundingClientRect();
      const viewportCentre = window.innerHeight / 2;
      const stageCentre = rect.top + rect.height / 2;
      const travel = (window.innerHeight + rect.height) / 2;
      const progress = Math.max(
        -1,
        Math.min(1, (viewportCentre - stageCentre) / travel),
      );
      stage.style.setProperty("--preview-scroll", progress.toFixed(3));
    };

    const scheduleScrollDepth = () => {
      if (animationFrame === undefined) {
        animationFrame = window.requestAnimationFrame(updateScrollDepth);
      }
    };

    const syncMotionPreference = () => {
      if (reducedMotion.matches) reset();
      else scheduleScrollDepth();
    };

    window.addEventListener("scroll", scheduleScrollDepth, { passive: true });
    window.addEventListener("resize", scheduleScrollDepth);
    reducedMotion.addEventListener("change", syncMotionPreference);
    scheduleScrollDepth();

    return () => {
      window.removeEventListener("scroll", scheduleScrollDepth);
      window.removeEventListener("resize", scheduleScrollDepth);
      reducedMotion.removeEventListener("change", syncMotionPreference);
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  function moveAtmosphere(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    event.currentTarget.style.setProperty("--preview-x", x.toFixed(3));
    event.currentTarget.style.setProperty("--preview-y", y.toFixed(3));
  }

  function resetAtmosphere(event: ReactPointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--preview-x", "0");
    event.currentTarget.style.setProperty("--preview-y", "0");
  }

  return (
    <section
      ref={stageRef}
      id="request"
      onPointerMove={moveAtmosphere}
      onPointerLeave={resetAtmosphere}
      className="private-preview-stage relative isolate scroll-mt-24 overflow-hidden bg-[linear-gradient(132deg,#e7e2dc_0%,#d8d6d2_52%,#e7ddd4_100%)] pt-[clamp(84px,9.4vw,138px)] pb-[clamp(78px,8.8vw,126px)]"
    >
      <div
        aria-hidden="true"
        className="private-preview-atmosphere pointer-events-none absolute -inset-[3%] -z-10 bg-[radial-gradient(ellipse_at_50%_48%,rgba(255,252,247,0.72),transparent_54%),radial-gradient(circle_at_92%_6%,rgba(222,112,58,0.16),transparent_25%),radial-gradient(circle_at_5%_96%,rgba(255,250,242,0.62),transparent_30%),repeating-radial-gradient(circle_at_96%_10%,transparent_0_104px,rgba(11,17,39,0.075)_105px_106px)]"
      />
      <div
        aria-hidden="true"
        className="private-preview-grid pointer-events-none absolute -inset-4 -z-10 opacity-40 [background-image:linear-gradient(rgba(11,17,39,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(11,17,39,0.07)_1px,transparent_1px)] [background-size:82px_82px] [mask-image:linear-gradient(90deg,black,transparent_24%,transparent_76%,black)]"
      />
      <div
        aria-hidden="true"
        className="private-preview-watermark pointer-events-none absolute top-[7%] left-[-0.045em] -z-10 whitespace-nowrap font-site-sans text-[clamp(76px,11vw,170px)] leading-[0.73] font-semibold tracking-[-0.075em] text-site-ink/[0.045] uppercase select-none"
      >
        Private preview
      </div>

      <div className="relative z-[1] mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div
          aria-hidden="true"
          className="private-preview-frame pointer-events-none absolute inset-x-[clamp(10px,1.5vw,22px)] inset-y-[-28px] -z-10 border border-site-ink/10 max-[700px]:inset-x-3 max-[700px]:inset-y-[-18px]"
        >
          <span className="absolute -top-px -left-px h-5 w-5 border-t border-l border-site-ink/45" />
          <span className="absolute -top-px -right-px h-5 w-5 border-t border-r border-site-ink/45" />
          <span className="absolute -bottom-px -left-px h-5 w-5 border-b border-l border-site-ink/45" />
          <span className="absolute -right-px -bottom-px h-5 w-5 border-r border-b border-site-ink/45" />

          <span className="absolute top-[-20px] left-8 bg-[#dfdcd7] px-3 font-site-mono text-[9px] uppercase tracking-[0.18em] text-site-ink/55 max-[700px]:hidden">
            Private access / 01
          </span>
          <span className="absolute right-8 bottom-[-20px] bg-[#e2d9d1] px-3 font-site-mono text-[9px] uppercase tracking-[0.18em] text-site-ink/55 max-[700px]:hidden">
            Subra / limited cohort
          </span>

          <span className="absolute top-1/2 left-[-42px] -translate-y-1/2 -rotate-90 font-site-mono text-[8px] uppercase tracking-[0.24em] text-site-ink/35 max-[900px]:hidden">
            Evidence infrastructure
          </span>
          <span className="absolute top-1/2 right-[-22px] h-px w-11 -translate-y-1/2 bg-site-accent/70" />
          <span className="absolute top-1/2 right-[-24px] h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-site-accent" />
        </div>

        <div className="site-dots relative grid items-start gap-[clamp(42px,5.2vw,76px)] overflow-hidden rounded-[clamp(14px,1.8vw,26px)] bg-site-ink p-[clamp(32px,4.6vw,66px)] text-site-cream [grid-template-columns:minmax(0,0.82fr)_minmax(0,1.18fr)] after:pointer-events-none after:absolute after:inset-0 after:z-0 after:bg-[radial-gradient(58%_52%_at_90%_108%,rgba(255,233,198,0.12),transparent_70%)] after:content-[''] max-[1000px]:grid-cols-[minmax(0,1fr)]">
          <div className="relative z-[1]">
            <div className="mb-[22px] font-site-mono text-[10.5px] uppercase tracking-[0.16em] text-site-accent select-none">
              Private preview
            </div>
            <RevealHeading
              lead="Be ready to explain every"
              accent="agent action that matters."
              className="max-w-[14ch] text-[clamp(30px,4.2vw,48px)] leading-[1.04] font-medium tracking-[-0.04em] text-site-cream"
            />
            <p className="mt-6 max-w-[43ch] text-[16px] leading-[1.68] text-site-cream/80">
              We&apos;re working with a limited number of regulated
              organisations that operate real AI-agent workflows and need
              stronger evidence around authority, accountability and actions.
            </p>
            <div className="mt-9 flex items-center gap-3 border-t border-site-hair pt-5 font-site-mono text-[10px] uppercase tracking-[0.13em] text-site-cream-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-site-accent" />
              Limited preview cohort
            </div>
          </div>

          <div className="relative z-[1]">
            <AccessRequestForm />
          </div>
        </div>
      </div>
    </section>
  );
}
