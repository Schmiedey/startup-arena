import { google } from "googleapis";

interface EmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface SignInEmailInput {
  to: string;
  url: string;
}

interface LinkEmailInput {
  to: string;
  url: string;
}

function cleanSecret(value: string | undefined) {
  return value?.trim().replace(/(?:\\r|\\n)+$/g, "");
}

export function isGmailEmailConfigured() {
  return Boolean(
    cleanSecret(process.env.GMAIL_CLIENT_ID)
      && cleanSecret(process.env.GMAIL_CLIENT_SECRET)
      && cleanSecret(process.env.GMAIL_REFRESH_TOKEN)
      && cleanSecret(process.env.GMAIL_SENDER_EMAIL)
  );
}

function gmailOAuthClient() {
  const clientId = cleanSecret(process.env.GMAIL_CLIENT_ID);
  const clientSecret = cleanSecret(process.env.GMAIL_CLIENT_SECRET);
  const refreshToken = cleanSecret(process.env.GMAIL_REFRESH_TOKEN);

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail API email is not configured");
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

function encodeHeader(value: string) {
  return value.replace(/\r?\n/g, " ").trim();
}

function htmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

export function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

export function buildRawEmail({ to, subject, text, html }: EmailInput) {
  const senderEmail = cleanSecret(process.env.GMAIL_SENDER_EMAIL);
  if (!senderEmail) throw new Error("GMAIL_SENDER_EMAIL is not configured");

  const boundary = `likelyr-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const headers = [
    `From: Likelyr <${senderEmail}>`,
    `To: ${encodeHeader(to)}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
  ];

  if (!html) {
    return [
      ...headers,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      text,
    ].join("\r\n");
  }

  return [
    ...headers,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    text,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    html,
    `--${boundary}--`,
  ].join("\r\n");
}

export async function sendEmail(input: EmailInput) {
  const gmail = google.gmail({ version: "v1", auth: gmailOAuthClient() });
  const raw = base64UrlEncode(buildRawEmail(input));

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}

export async function sendSignInEmail({ to, url }: SignInEmailInput) {
  const host = new URL(url).host;
  await sendEmail({
    to,
    subject: `Sign in to ${host}`,
    text: [
      `Sign in to ${host}`,
      "",
      "Use this secure link to sign in:",
      url,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: [
      "<div style=\"font-family:Arial,sans-serif;line-height:1.5;color:#111827\">",
      `<h1 style=\"font-size:20px\">Sign in to ${htmlEscape(host)}</h1>`,
      "<p>Use this secure link to sign in:</p>",
      `<p><a href=\"${htmlEscape(url)}\" style=\"display:inline-block;background:#dc3c1e;color:white;padding:10px 14px;text-decoration:none;font-weight:700\">Sign in to Likelyr</a></p>`,
      "<p style=\"color:#6b7280;font-size:13px\">If you did not request this, you can ignore this email.</p>",
      "</div>",
    ].join(""),
  });
}

export async function sendEmailVerificationEmail({ to, url }: LinkEmailInput) {
  await sendEmail({
    to,
    subject: "Verify your Likelyr email",
    text: [
      "Verify your Likelyr email",
      "",
      "Use this secure link to verify your account:",
      url,
      "",
      "This link expires in 1 hour. If you did not create a Likelyr account, you can ignore this email.",
    ].join("\n"),
    html: [
      "<div style=\"font-family:Arial,sans-serif;line-height:1.5;color:#111827\">",
      "<h1 style=\"font-size:20px\">Verify your Likelyr email</h1>",
      "<p>Use this secure link to verify your account:</p>",
      `<p><a href=\"${htmlEscape(url)}\" style=\"display:inline-block;background:#dc3c1e;color:white;padding:10px 14px;text-decoration:none;font-weight:700\">Verify email</a></p>`,
      "<p style=\"color:#6b7280;font-size:13px\">This link expires in 1 hour. If you did not create a Likelyr account, you can ignore this email.</p>",
      "</div>",
    ].join(""),
  });
}

export async function sendPasswordResetEmail({ to, url }: LinkEmailInput) {
  await sendEmail({
    to,
    subject: "Reset your Likelyr password",
    text: [
      "Reset your Likelyr password",
      "",
      "Use this secure link to choose a new password:",
      url,
      "",
      "This link expires in 30 minutes. If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: [
      "<div style=\"font-family:Arial,sans-serif;line-height:1.5;color:#111827\">",
      "<h1 style=\"font-size:20px\">Reset your Likelyr password</h1>",
      "<p>Use this secure link to choose a new password:</p>",
      `<p><a href=\"${htmlEscape(url)}\" style=\"display:inline-block;background:#dc3c1e;color:white;padding:10px 14px;text-decoration:none;font-weight:700\">Reset password</a></p>`,
      "<p style=\"color:#6b7280;font-size:13px\">This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>",
      "</div>",
    ].join(""),
  });
}
