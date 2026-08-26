import { startAuth } from "@/domains/auth/auth-redirects";

/** `/login` — forwarded to Auth0's Universal Login. */
export async function GET(): Promise<Response> {
  return startAuth("login");
}

// Starting a flow writes a per-attempt cookie and reads the request headers to
// decide whether to start one at all, so this is never a response that can be
// computed once at build time and handed to everybody.
export const dynamic = "force-dynamic";
