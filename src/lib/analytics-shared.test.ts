import { describe, expect, it } from "vitest";
import { cleanMetadata, isEventName, normalizedPath } from "./analytics-shared";

describe("analytics helpers", () => {
  it("validates stable event names", () => {
    expect(isEventName("page_view")).toBe(true);
    expect(isEventName("checkout_completed")).toBe(true);
    expect(isEventName("Page View")).toBe(false);
    expect(isEventName("$pageview")).toBe(false);
  });

  it("keeps metadata primitive and bounded", () => {
    expect(cleanMetadata({
      label: "  Submit   Idea  ",
      count: 2,
      ok: true,
      empty: null,
      nested: { no: true },
    })).toEqual({
      label: "Submit Idea",
      count: 2,
      ok: true,
      empty: null,
    });
  });

  it("normalizes paths to the database limit", () => {
    expect(normalizedPath(null)).toBeNull();
    expect(normalizedPath(`/x${"a".repeat(400)}`)?.length).toBe(300);
  });
});
