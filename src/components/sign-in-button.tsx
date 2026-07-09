import { signInAction } from "@/lib/auth-actions";

export function SignInButton() {
  return (
    <form action={signInAction}>
      <button
        type="submit"
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Sign in
      </button>
    </form>
  );
}
