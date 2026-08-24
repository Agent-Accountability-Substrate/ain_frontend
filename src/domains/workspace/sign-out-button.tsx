import { signOutAction } from "@/domains/auth/auth-actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-md border px-4 py-2 text-sm font-medium"
      >
        Sign out
      </button>
    </form>
  );
}
