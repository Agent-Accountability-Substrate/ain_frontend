/**
 * The site's canonical external origin.
 *
 * One literal, three consumers: `metadataBase` in the root layout resolves
 * every relative `alternates.canonical`, and `robots.ts` and `sitemap.ts` have
 * to emit absolute URLs because both formats require them. Spelled out three
 * times, a domain change fixes the pages a visitor sees and silently leaves
 * the crawler pointed at the old host.
 *
 * Not read from the environment. `AUTH_URL` pins the origin Auth.js writes
 * cookies for, which is per-deployment and is `https://<preview>.vercel.app`
 * on every preview build; a sitemap that named the preview host would invite
 * Google to index it. This is the address the site is published at, which is a
 * fact about the product rather than about the deployment.
 */
export const SITE_ORIGIN = "https://subrahq.com";

/** `SITE_ORIGIN` with `path` appended. `path` must start with a slash. */
export function siteUrl(path: string): string {
  return `${SITE_ORIGIN}${path}`;
}
