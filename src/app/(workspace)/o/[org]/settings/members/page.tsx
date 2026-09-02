import { OrganisationMembersView } from "@/domains/organisations/organisation-members-view";
import { SettingsLayout } from "@/domains/workspace/settings-layout";
import { loadOrganisationPage } from "@/domains/workspace/organisation-page";
import { orgHref } from "@/domains/workspace/workspace-routes";
import { listMembers } from "@/lib/registry/registry-api";

export const dynamic = "force-dynamic";

export default async function OrganisationMembersPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const page = await loadOrganisationPage(org);
  if (page.status !== "ready") return null;

  const members = await listMembers(page.organisation.id);

  return (
    <SettingsLayout
      currentPath={orgHref(page.organisation.ulid, "settings/members")}
      title="Members"
      lede="Who else can act for this company, and what they can do."
    >
      <OrganisationMembersView
        members={members ?? []}
        membersUnavailable={members === null}
        organisationId={page.organisation.id}
      />
    </SettingsLayout>
  );
}
