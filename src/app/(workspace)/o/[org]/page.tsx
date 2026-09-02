import { OrganisationHomeView } from "@/domains/organisations/organisation-home-view";
import { loadOrganisationPage } from "@/domains/workspace/organisation-page";

export const dynamic = "force-dynamic";

export default async function OrganisationHomePage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const page = await loadOrganisationPage(org);
  if (page.status !== "ready") return null;

  return (
    <OrganisationHomeView organisation={page.organisation} state={page.state} />
  );
}
