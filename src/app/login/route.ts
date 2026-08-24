import { startAuth } from "@/domains/auth/auth-redirects";

/** `/login` — forwarded to Auth0's Universal Login. */
export async function GET(): Promise<never> {
  return startAuth("login");
}
