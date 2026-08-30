import { OrganisationSettingsView } from "@/domains/organisations/organisation-settings-view";
import { loadOrganisationPage } from "@/domains/workspace/organisation-page";

export const dynamic = "force-dynamic";

export default async function OrganisationRegistrationPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const page = await loadOrganisationPage(org);
  if (page.status !== "ready") return null;

  return <OrganisationSettingsView organisation={page.organisation} />;
}
