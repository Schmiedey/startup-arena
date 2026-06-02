export const DEFAULT_AUTH_REDIRECT = "/dashboard";

function sameOriginBase(baseUrl?: string) {
  return baseUrl ?? process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost";
}

export function safeAuthRedirect(value?: string | null, baseUrl?: string) {
  if (!value) return DEFAULT_AUTH_REDIRECT;

  if (value.startsWith("/") && !value.startsWith("//")) return value;

  try {
    const base = new URL(sameOriginBase(baseUrl));
    const target = new URL(value, base);
    if (target.origin !== base.origin) return DEFAULT_AUTH_REDIRECT;
    return `${target.pathname}${target.search}${target.hash}` || DEFAULT_AUTH_REDIRECT;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
}

export function signinPathFor(callbackUrl?: string | null, baseUrl?: string) {
  const url = new URL("/signin", sameOriginBase(baseUrl));
  url.searchParams.set("callbackUrl", safeAuthRedirect(callbackUrl, baseUrl));
  return `${url.pathname}${url.search}`;
}
