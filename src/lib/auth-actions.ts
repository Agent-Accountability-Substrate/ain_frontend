"use server";

import { signIn, signOut } from "@/auth";

export async function signInAction(): Promise<void> {
  await signIn("auth0", { redirectTo: "/dashboard" });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
