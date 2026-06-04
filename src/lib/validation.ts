import { CATEGORIES, STAGES, type Category, type Stage } from "@/lib/types";
import { combinedPublicTextError } from "@/lib/moderation";

const IDEA_LIMITS = {
  name: 100,
  pitch: 300,
  target_customer: 100,
  problem: 500,
  revenue_model: 100,
};

const PREMIUM_PROFILE_LIMITS = {
  profile_headline: 90,
  profile_bio: 600,
  profile_cta_label: 40,
};

const FOUNDER_UPDATE_LIMITS = {
  title: 100,
  body: 700,
};

const LEAD_LIMITS = {
  email: 254,
  message: 600,
  source: 80,
};

const IMAGE_URL_LIMIT = 500;

export interface IdeaInput {
  name: string;
  pitch: string;
  target_customer: string;
  problem: string;
  revenue_model: string;
  category: Category;
  stage: Stage;
  image_url?: string | null;
}

type IdeaUpdate = Partial<IdeaInput> & { id: string };

export interface PremiumProfileInput {
  profile_headline?: string | null;
  profile_bio?: string | null;
  profile_website_url?: string | null;
  profile_demo_url?: string | null;
  profile_linkedin_url?: string | null;
  profile_x_url?: string | null;
  profile_cta_label?: string | null;
  profile_cta_url?: string | null;
  profile_show_contact?: boolean;
  profile_weekly_digest_opt_in?: boolean;
  profile_featured_category?: Category | null;
}

export interface FounderUpdateInput {
  title: string;
  body: string;
  idea_id?: string | null;
}

export interface LeadInput {
  founder_user_id: string;
  idea_id?: string | null;
  email?: string | null;
  message?: string | null;
  source?: string | null;
}

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cleanText(
  payload: Record<string, unknown>,
  key: keyof typeof IDEA_LIMITS,
  required: true
): ValidationResult<string>;
function cleanText(
  payload: Record<string, unknown>,
  key: keyof typeof IDEA_LIMITS,
  required: false
): ValidationResult<string | undefined>;
function cleanText(
  payload: Record<string, unknown>,
  key: keyof typeof IDEA_LIMITS,
  required: boolean
): ValidationResult<string | undefined> {
  const value = payload[key];

  if (value === undefined && !required) return { ok: true, data: undefined };
  if (typeof value !== "string") return { ok: false, error: `${key} is required` };

  const trimmed = value.trim();
  if (!trimmed) return { ok: false, error: `${key} cannot be empty` };
  if (trimmed.length > IDEA_LIMITS[key]) {
    return { ok: false, error: `${key} must be ${IDEA_LIMITS[key]} characters or fewer` };
  }

  return { ok: true, data: trimmed };
}

function cleanLimitedText<K extends string>(
  payload: Record<string, unknown>,
  key: K,
  limit: number
): ValidationResult<string | null | undefined> {
  const value = payload[key];

  if (value === undefined) return { ok: true, data: undefined };
  if (value === null) return { ok: true, data: null };
  if (typeof value !== "string") return { ok: false, error: `${key} must be text` };

  const trimmed = value.trim();
  if (!trimmed) return { ok: true, data: null };
  if (trimmed.length > limit) {
    return { ok: false, error: `${key} must be ${limit} characters or fewer` };
  }

  return { ok: true, data: trimmed };
}

function cleanRequiredLimitedText<K extends string>(
  payload: Record<string, unknown>,
  key: K,
  limit: number
): ValidationResult<string> {
  const value = payload[key];

  if (typeof value !== "string") return { ok: false, error: `${key} is required` };
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, error: `${key} cannot be empty` };
  if (trimmed.length > limit) {
    return { ok: false, error: `${key} must be ${limit} characters or fewer` };
  }

  return { ok: true, data: trimmed };
}

function cleanOptionalUrl(payload: Record<string, unknown>, key: string): ValidationResult<string | null | undefined> {
  const value = payload[key];

  if (value === undefined) return { ok: true, data: undefined };
  if (value === null) return { ok: true, data: null };
  if (typeof value !== "string") return { ok: false, error: `${key} must be a URL` };

  const trimmed = value.trim();
  if (!trimmed) return { ok: true, data: null };
  if (trimmed.length > 300) return { ok: false, error: `${key} must be 300 characters or fewer` };

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, error: `${key} must use http or https` };
    }
  } catch {
    return { ok: false, error: `${key} must be a valid URL` };
  }

  return { ok: true, data: trimmed };
}

function cleanOptionalBoolean(payload: Record<string, unknown>, key: string): ValidationResult<boolean | undefined> {
  const value = payload[key];
  if (value === undefined) return { ok: true, data: undefined };
  if (typeof value !== "boolean") return { ok: false, error: `${key} must be true or false` };
  return { ok: true, data: value };
}

function cleanOptionalCategoryValue(payload: Record<string, unknown>, key: string): ValidationResult<Category | null | undefined> {
  const value = payload[key];
  if (value === undefined) return { ok: true, data: undefined };
  if (value === null || value === "") return { ok: true, data: null };
  if (typeof value !== "string" || !(CATEGORIES as readonly string[]).includes(value)) {
    return { ok: false, error: "Invalid featured category" };
  }
  return { ok: true, data: value as Category };
}

function cleanCategory(
  payload: Record<string, unknown>,
  required: true
): ValidationResult<Category>;
function cleanCategory(
  payload: Record<string, unknown>,
  required: false
): ValidationResult<Category | undefined>;
function cleanCategory(
  payload: Record<string, unknown>,
  required: boolean
): ValidationResult<Category | undefined> {
  const value = payload.category;

  if (value === undefined && !required) return { ok: true, data: undefined };
  if (typeof value !== "string" || !(CATEGORIES as readonly string[]).includes(value)) {
    return { ok: false, error: "Invalid category" };
  }

  return { ok: true, data: value as Category };
}

function cleanStage(
  payload: Record<string, unknown>,
  required: true
): ValidationResult<Stage>;
function cleanStage(
  payload: Record<string, unknown>,
  required: false
): ValidationResult<Stage | undefined>;
function cleanStage(
  payload: Record<string, unknown>,
  required: boolean
): ValidationResult<Stage | undefined> {
  const value = payload.stage;

  if (value === undefined && !required) return { ok: true, data: undefined };
  if (typeof value !== "string" || !(STAGES as readonly string[]).includes(value)) {
    return { ok: false, error: "Invalid stage" };
  }

  return { ok: true, data: value as Stage };
}

export function validateIdeaPayload(payload: unknown): ValidationResult<IdeaInput> {
  if (!isRecord(payload)) return { ok: false, error: "Invalid request body" };

  const name = cleanText(payload, "name", true);
  if (!name.ok) return name;
  const pitch = cleanText(payload, "pitch", true);
  if (!pitch.ok) return pitch;
  const targetCustomer = cleanText(payload, "target_customer", true);
  if (!targetCustomer.ok) return targetCustomer;
  const problem = cleanText(payload, "problem", true);
  if (!problem.ok) return problem;
  const revenueModel = cleanText(payload, "revenue_model", true);
  if (!revenueModel.ok) return revenueModel;
  const category = cleanCategory(payload, true);
  if (!category.ok) return category;
  const stage = cleanStage(payload, true);
  if (!stage.ok) return stage;
  const imageUrl = cleanOptionalUrl(payload, "image_url");

  const spamError = combinedPublicTextError([
    name.data,
    pitch.data,
    targetCustomer.data,
    problem.data,
    revenueModel.data,
  ]);
  if (spamError) return { ok: false, error: spamError };

  if (imageUrl.ok && imageUrl.data && imageUrl.data.length > IMAGE_URL_LIMIT) {
    return { ok: false, error: "Image URL must be 500 characters or fewer" };
  }

  return {
    ok: true,
    data: {
      name: name.data,
      pitch: pitch.data,
      target_customer: targetCustomer.data,
      problem: problem.data,
      revenue_model: revenueModel.data,
      category: category.data,
      stage: stage.data,
      image_url: imageUrl.ok ? imageUrl.data : null,
    },
  };
}

export function validateIdeaUpdatePayload(payload: unknown): ValidationResult<IdeaUpdate> {
  if (!isRecord(payload)) return { ok: false, error: "Invalid request body" };
  if (typeof payload.id !== "string" || !payload.id.trim()) {
    return { ok: false, error: "Idea ID required" };
  }

  const data: IdeaUpdate = { id: payload.id.trim() };
  for (const key of Object.keys(IDEA_LIMITS) as Array<keyof typeof IDEA_LIMITS>) {
    const result = cleanText(payload, key, false);
    if (!result.ok) return result;
    if (result.data !== undefined) data[key] = result.data;
  }

  const category = cleanCategory(payload, false);
  if (!category.ok) return category;
  if (category.data !== undefined) data.category = category.data;

  const stage = cleanStage(payload, false);
  if (!stage.ok) return stage;
  if (stage.data !== undefined) data.stage = stage.data;

  const spamError = combinedPublicTextError([
    data.name ?? "",
    data.pitch ?? "",
    data.target_customer ?? "",
    data.problem ?? "",
    data.revenue_model ?? "",
  ]);
  if (spamError) return { ok: false, error: spamError };

  return { ok: true, data };
}

export function validatePremiumProfilePayload(payload: unknown): ValidationResult<PremiumProfileInput> {
  if (!isRecord(payload)) return { ok: false, error: "Invalid request body" };

  const data: PremiumProfileInput = {};

  for (const [key, limit] of Object.entries(PREMIUM_PROFILE_LIMITS) as Array<[keyof typeof PREMIUM_PROFILE_LIMITS, number]>) {
    const result = cleanLimitedText(payload, key, limit);
    if (!result.ok) return result;
    if (result.data !== undefined) data[key] = result.data;
  }

  for (const key of ["profile_website_url", "profile_demo_url", "profile_linkedin_url", "profile_x_url", "profile_cta_url"] as const) {
    const result = cleanOptionalUrl(payload, key);
    if (!result.ok) return result;
    if (result.data !== undefined) data[key] = result.data;
  }

  for (const key of ["profile_show_contact", "profile_weekly_digest_opt_in"] as const) {
    const result = cleanOptionalBoolean(payload, key);
    if (!result.ok) return result;
    if (result.data !== undefined) data[key] = result.data;
  }

  const featuredCategory = cleanOptionalCategoryValue(payload, "profile_featured_category");
  if (!featuredCategory.ok) return featuredCategory;
  if (featuredCategory.data !== undefined) data.profile_featured_category = featuredCategory.data;

  const spamError = combinedPublicTextError([
    data.profile_headline ?? "",
    data.profile_bio ?? "",
    data.profile_cta_label ?? "",
  ]);
  if (spamError) return { ok: false, error: spamError };

  return { ok: true, data };
}

export function validateFounderUpdatePayload(payload: unknown): ValidationResult<FounderUpdateInput> {
  if (!isRecord(payload)) return { ok: false, error: "Invalid request body" };

  const title = cleanRequiredLimitedText(payload, "title", FOUNDER_UPDATE_LIMITS.title);
  if (!title.ok) return title;
  const body = cleanRequiredLimitedText(payload, "body", FOUNDER_UPDATE_LIMITS.body);
  if (!body.ok) return body;

  const ideaValue = payload.idea_id;
  const ideaId = typeof ideaValue === "string" && ideaValue.trim() ? ideaValue.trim() : null;
  const spamError = combinedPublicTextError([title.data, body.data]);
  if (spamError) return { ok: false, error: spamError };

  return {
    ok: true,
    data: {
      title: title.data,
      body: body.data,
      idea_id: ideaId,
    },
  };
}

export function validateLeadPayload(payload: unknown): ValidationResult<LeadInput> {
  if (!isRecord(payload)) return { ok: false, error: "Invalid request body" };
  if (typeof payload.founder_user_id !== "string" || !payload.founder_user_id.trim()) {
    return { ok: false, error: "Founder is required" };
  }

  const email = cleanLimitedText(payload, "email", LEAD_LIMITS.email);
  if (!email.ok) return email;
  const message = cleanLimitedText(payload, "message", LEAD_LIMITS.message);
  if (!message.ok) return message;
  const source = cleanLimitedText(payload, "source", LEAD_LIMITS.source);
  if (!source.ok) return source;

  if (email.data && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.data)) {
    return { ok: false, error: "Use a valid email address" };
  }

  const spamError = combinedPublicTextError([message.data ?? "", source.data ?? ""]);
  if (spamError) return { ok: false, error: spamError };

  return {
    ok: true,
    data: {
      founder_user_id: payload.founder_user_id.trim(),
      idea_id: typeof payload.idea_id === "string" && payload.idea_id.trim() ? payload.idea_id.trim() : null,
      email: email.data ?? null,
      message: message.data ?? null,
      source: source.data ?? null,
    },
  };
}
