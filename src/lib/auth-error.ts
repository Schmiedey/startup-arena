const AUTH_ERROR_MESSAGES: Record<string, string> = {
  MissingCSRF: "Your sign-in session expired. Please try again.",
  OAuthAccountNotLinked: "That email is already linked to another sign-in method.",
  OAuthCallbackError: "Google could not complete sign in. Please try again.",
  OAuthSignInError: "Could not start sign in. Please try again.",
  AccessDenied: "Access was denied for this sign-in attempt.",
  Verification: "That sign-in link is invalid or expired.",
};

export function authErrorMessage(error?: string | null) {
  if (!error) return null;
  return AUTH_ERROR_MESSAGES[error] ?? "Could not sign in. Please try again.";
}
