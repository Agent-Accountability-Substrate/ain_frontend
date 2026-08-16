import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrganisationsView } from "@/components/organisations-view";
import { loadAccountWorkspace } from "@/lib/registry-api";

export const dynamic = "force-dynamic";

export default async function OrganisationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();

  if (!session?.user) redirect("/");

  // Which organisation is selected comes from the URL, not from a cookie or
  // from server memory. Every tenant route on the backend names its
  // organisation in the path; an ambient selection on the client would put
  // back exactly the implicit tenancy that removed.
  const selected = (await searchParams)["org"];

  return (
    <OrganisationsView
      email={session.user.email}
      state={await loadAccountWorkspace(
        typeof selected === "string" ? selected : null,
      )}
    />
  );
}
