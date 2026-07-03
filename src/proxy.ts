export { auth as proxy } from "@/auth";

/**
 * Only guard the authenticated surfaces. Unauthenticated requests to a matched
 * path are redirected to sign-in by the `authorized` callback in `@/auth`.
 */
export const config = {
  matcher: ["/dashboard/:path*"],
};
