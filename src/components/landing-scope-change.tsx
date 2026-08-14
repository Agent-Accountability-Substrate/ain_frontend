import { LandingScopeDiff } from "./landing-scope-diff";

export function LandingScopeChange() {
  return (
    <section className="border-t border-line bg-band">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-32 lg:px-8">
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-secondary">
          Scope change
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end lg:gap-16">
          <h2 className="max-w-[24ch] text-balance text-[32px] font-normal leading-[1.08] tracking-[-0.03em] text-ink sm:text-[42px] lg:text-[46px]">
            A widened scope is a new version, not an edit.
          </h2>
          <p className="max-w-[46ch] text-base leading-[1.55] text-slate-700">
            The diff against the version in force shows exactly what changed,
            and the version it replaces stays on the record.
          </p>
        </div>

        <LandingScopeDiff />
      </div>
    </section>
  );
}
