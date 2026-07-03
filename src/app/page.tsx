import { SignInButton } from "@/components/sign-in-button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">AIN-Registry</h1>
      <p className="max-w-prose text-lg">
        The accountability registry for autonomous AI agents.
      </p>
      <p className="text-sm text-muted-foreground">
        Phase 0 — under construction
      </p>
      <SignInButton />
    </main>
  );
}
