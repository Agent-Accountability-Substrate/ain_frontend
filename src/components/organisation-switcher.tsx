import { Building2, ChevronDown } from "lucide-react";

import type { OrganisationSummary } from "@/lib/account-workspace";

export function OrganisationSwitcher({
  organisations,
  selectedOrganisationId,
}: {
  organisations: readonly Pick<OrganisationSummary, "id" | "name">[];
  selectedOrganisationId: string | null;
}) {
  const hasOrganisations = organisations.length > 0;

  return (
    <label className="organisation-switcher">
      <span className="sr-only">Organisation switcher</span>
      <Building2 className="h-4 w-4" aria-hidden="true" />
      <select
        aria-label="Organisation switcher"
        disabled={!hasOrganisations}
        defaultValue={selectedOrganisationId ?? ""}
      >
        {!hasOrganisations ? (
          <option value="">No organisation selected</option>
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
