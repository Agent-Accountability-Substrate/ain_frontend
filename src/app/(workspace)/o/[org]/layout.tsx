import type { ReactNode } from "react";

import { loadOrganisationPage } from "@/domains/workspace/organisation-page";

/**
 * The tenant gate for everything addressed by an organisation.
 *
 * The check itself lives in `loadOrganisationPage`, and every page under here
 * already calls it. Running it once more in the layout is what makes it an
 * inherited property of the segment rather than a line each new page has to
 * remember: a page that reached for `loadWorkspace` directly — as the
 * account-level screens legitimately do — would otherwise resolve the caller's
 * *own* first organisation and serve it under a stranger's ULID with a 200.
 *
 * It costs nothing. `fetchWorkspace` and `currentSession` are both memoised
 * for the request, so the layout and the page inside it share one round trip
 * and one session decrypt.
 */
export default async function OrganisationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  // `notFound()` on a ULID this account is not in; an outage falls through to
  // the frame the workspace layout above has already replaced.
  await loadOrganisationPage(org);
  return children;
}
