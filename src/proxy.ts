export { auth as proxy } from "@/auth";

/**
 * Deny-by-default: run the auth gate on every route except Auth.js's own
 * endpoints and static assets. The `authorized` callback in `@/auth` decides
 * public vs protected, and every protected page/route re-checks the session
 * itself — middleware is an optimization, never the sole gate.
 */
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
