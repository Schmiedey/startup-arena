import { CATEGORIES, STAGES, type Category, type Stage } from "@/lib/types";
import { combinedPublicTextError } from "@/lib/moderation";

const IDEA_LIMITS = {
  name: 100,
  pitch: 300,
  target_customer: 100,
  problem: 500,
  revenue_model: 100,
};

export interface IdeaInput {
  name: string;
  pitch: string;
  target_customer: string;
  problem: string;
  revenue_model: string;
  category: Category;
  stage: Stage;
}

type IdeaUpdate = Partial<IdeaInput> & { id: string };

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

  const spamError = combinedPublicTextError([
    name.data,
    pitch.data,
    targetCustomer.data,
    problem.data,
    revenueModel.data,
  ]);
  if (spamError) return { ok: false, error: spamError };

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
