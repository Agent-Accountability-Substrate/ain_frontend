import { AinDelegationDiagram } from "./ain-delegation-diagram";

export function LandingBoundary() {
  return (
    <section className="border-t border-line bg-band">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-32 lg:px-8">
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-secondary">
          Boundary
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end lg:gap-16">
          <h2 className="max-w-[24ch] text-balance text-[32px] font-normal leading-[1.08] tracking-[-0.03em] text-ink sm:text-[42px] lg:text-[46px]">
            We record what your agents did. We never decide what they may do.
          </h2>
          <p className="max-w-[46ch] text-base leading-[1.55] text-slate-700">
            AIN sits alongside your runtime, your IAM and your policy gateway,
            never between them and the work. If AIN is unavailable, nothing in
            your firm stops.
          </p>
        </div>

        <AinDelegationDiagram />
      </div>
    </section>
  );
}
