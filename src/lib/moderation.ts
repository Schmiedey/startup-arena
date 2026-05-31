const BLOCKED_PATTERNS = [
  /\bviagra\b/i,
  /\bcialis\b/i,
  /\bonlyfans\b/i,
  /\bporn\b/i,
  /\bcasino\b/i,
  /\btelegram\s*[:@]/i,
  /\bwhatsapp\s*[:@]/i,
];

function urlCount(text: string) {
  return (text.match(/https?:\/\/|www\./gi) ?? []).length;
}

function uppercaseRatio(text: string) {
  const letters = text.match(/[a-z]/gi) ?? [];
  if (letters.length < 30) return 0;
  const uppercase = letters.filter((letter) => letter === letter.toUpperCase()).length;
  return uppercase / letters.length;
}

export function publicTextError(text: string, options?: { maxUrls?: number }) {
  const maxUrls = options?.maxUrls ?? 1;

  if (urlCount(text) > maxUrls) {
    return "Too many links. Keep it focused and remove extra URLs.";
  }

  if (/(.)\1{9,}/.test(text)) {
    return "Text has too many repeated characters.";
  }

  if (uppercaseRatio(text) > 0.85) {
    return "Use normal casing instead of all caps.";
  }

  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(text))) {
    return "This looks like spam. Rewrite it without promotional spam terms.";
  }

  return null;
}

export function combinedPublicTextError(values: string[]) {
  return publicTextError(values.filter(Boolean).join(" "), { maxUrls: 2 });
}
