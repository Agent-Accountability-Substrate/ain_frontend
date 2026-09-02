"use client";

import { Building2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import { SelectField } from "@/lib/ui/select-field";

/**
 * Which organisation the workspace is acting for.
 *
 * The choice lives in the URL — `?org=<id>` — and nowhere else. Every tenant
 * route on the registry names its organisation in the path, and a cookie or a
 * server-side "current organisation" would put back exactly the ambient tenancy
 * that removed: a request whose tenant you cannot see by looking at it.
 *
 * A native `<select>` used to drive this, and it moved the selection on every
 * arrow keypress — each one a `router.push` to a `force-dynamic` page, so
 * holding Down fired a burst of server round trips and landed the caller
 * somewhere they never chose. A listbox highlights on arrow and commits on
 * Enter, so the navigation happens once, when it is meant.
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

  function select(organisationId: string): void {
    const next = new URLSearchParams(searchParams);
    if (organisationId) next.set("org", organisationId);
    else next.delete("org");
    const query = next.toString();
    // A navigation rather than local state: the pages read the registry per
    // request, and the agent list and verification status both belong to the
    // organisation being switched to.
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 shrink-0 text-mist" aria-hidden="true" />
      <SelectField
        label="Organisation switcher"
        labelHidden
        className="min-w-56"
        items={organisations.map((organisation) => ({
          value: organisation.id,
          label: organisation.name,
        }))}
        disabled={organisations.length === 0}
        value={selectedOrganisationId ?? ""}
        onValueChange={select}
        placeholder={
          organisations.length > 0
            ? "Select an organisation"
            : "No organisation selected"
        }
      />
    </div>
  );
}
