"use server";

import { signIn } from "@/auth";
import { safeAuthRedirect } from "@/lib/auth-redirect";
import { redirect } from "next/navigation";

const oauthProviders = new Set(["github", "google"]);

export async function startOAuthSignIn(formData: FormData) {
  const provider = formData.get("provider");
  if (typeof provider !== "string" || !oauthProviders.has(provider)) {
    redirect("/signin?error=Configuration");
  }

  const redirectTo = safeAuthRedirect(formData.get("callbackUrl")?.toString());
  await signIn(provider, { redirectTo });
}
