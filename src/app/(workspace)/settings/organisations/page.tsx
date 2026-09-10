import { OrganisationsView } from "@/domains/organisations/organisations-view";
import { loadAccountPage } from "@/domains/workspace/account-page";

export const dynamic = "force-dynamic";

export default async function OrganisationsPage() {
  const page = await loadAccountPage();
  if (page.status !== "ready") return null;

  return <OrganisationsView email={page.email} state={page.state} />;
}
