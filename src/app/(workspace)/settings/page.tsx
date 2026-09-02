import { SettingsHubView } from "@/domains/workspace/settings-hub-view";
import { loadAccountPage } from "@/domains/workspace/account-page";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const page = await loadAccountPage();
  if (page.status !== "ready") return null;

  return <SettingsHubView organisation={page.organisation} />;
}
