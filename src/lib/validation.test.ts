import { describe, expect, it } from "vitest";
import { validateIdeaPayload, validateIdeaUpdatePayload } from "./validation";

const validIdea = {
  name: "LeadSniper AI",
  pitch: "Finds bad local business websites and sends personalized cold emails.",
  target_customer: "Local service businesses",
  problem: "Most local businesses do not know their website is costing them leads.",
  revenue_model: "$49/month subscription",
  category: "AI",
  stage: "MVP",
};

describe("idea validation", () => {
  it("trims and accepts a valid submission", () => {
    const result = validateIdeaPayload({ ...validIdea, name: "  LeadSniper AI  " });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.name).toBe("LeadSniper AI");
  });

  it("rejects invalid categories and empty required text", () => {
    expect(validateIdeaPayload({ ...validIdea, category: "Crypto" }).ok).toBe(false);
    expect(validateIdeaPayload({ ...validIdea, pitch: "   " }).ok).toBe(false);
  });

  it("allows partial updates but validates supplied fields", () => {
    const result = validateIdeaUpdatePayload({ id: "idea-1", pitch: "  Better pitch.  " });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: "idea-1", pitch: "Better pitch." });
    }

    expect(validateIdeaUpdatePayload({ id: "idea-1", stage: "Prototype" }).ok).toBe(false);
  });
});
