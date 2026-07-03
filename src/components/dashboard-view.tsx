import { SignOutButton } from "@/components/sign-out-button";

export function DashboardView({ email }: { email: string | null | undefined }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-lg">
        Signed in as <span className="font-medium">{email ?? "unknown"}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Phase 0 — an empty authenticated surface. The registry, trust-ops
        console, and evidence tools arrive in later phases.
      </p>
      <SignOutButton />
    </main>
  );
}
