"use client";

import { Building2, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { OrganisationSummary } from "@/domains/workspace/account-workspace";

/**
 * Which organisation the workspace is acting for.
 *
 * The choice lives in the URL — `?org=<id>` — and nowhere else. Every tenant
 * route on the registry names its organisation in the path, and a cookie or a
 * server-side "current organisation" would put back exactly the ambient
 * tenancy that removed: a request whose tenant you cannot see by looking at
 * it. In the URL it is shareable, bookmarkable, survives a reload, and two
 * tabs can sit in two organisations without fighting.
 *
 * A selection the caller is not a member of is dropped when the workspace is
 * loaded, so an edited URL cannot make the shell claim an organisation that is
 * not in its own list. The registry refuses it independently either way.
 */
export function OrganisationSwitcher({
  organisations,
  selectedOrganisationId,
}: {
  organisations: readonly Pick<OrganisationSummary, "id" | "name">[];
  selectedOrganisationId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasOrganisations = organisations.length > 0;

  function select(organisationId: string): void {
    const next = new URLSearchParams(searchParams);
    if (organisationId) {
      next.set("org", organisationId);
    } else {
      next.delete("org");
    }
    const query = next.toString();
    // The pages read the registry per request, so this has to be a navigation
    // rather than local state: the agent list and the verification status both
    // belong to the organisation being switched to.
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <label className="organisation-switcher">
      <span className="sr-only">Organisation switcher</span>
      <Building2 className="h-4 w-4" aria-hidden="true" />
      <select
        aria-label="Organisation switcher"
        disabled={!hasOrganisations}
        value={selectedOrganisationId ?? ""}
        onChange={(event) => select(event.target.value)}
      >
        {/* Present whenever nothing is chosen — with several organisations and
            no selection, the shell must say so rather than imply the first. */}
        {selectedOrganisationId === null ? (
          <option value="">
            {hasOrganisations
              ? "Select an organisation"
              : "No organisation selected"}
          </option>
        ) : null}
        {organisations.map((organisation) => (
          <option key={organisation.id} value={organisation.id}>
            {organisation.name}
          </option>
        ))}
      </select>
      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
    </label>
  );
}
