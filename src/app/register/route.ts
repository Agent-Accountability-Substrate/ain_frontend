import { startAuth } from "@/domains/auth/auth-redirects";

/** `/register` — forwarded to Auth0's Universal Login, sign-up screen. */
export async function GET(): Promise<never> {
  return startAuth("signup");
}
