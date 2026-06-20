import { describe, expect, it } from "vitest";
import { isDateOnlyIso, toIsoOrNull } from "./dueDateTime";

describe("dueDateTime", () => {
  it("encodes date-only input as UTC noon with the date-only marker", () => {
    const iso = toIsoOrNull("2026-04-14");

    expect(iso).toBe("2026-04-14T12:00:00.777Z");
    expect(isDateOnlyIso(iso)).toBe(true);
  });
});
