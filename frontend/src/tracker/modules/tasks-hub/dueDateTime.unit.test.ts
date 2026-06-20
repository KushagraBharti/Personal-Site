import { describe, expect, it } from "vitest";
import { isDateOnlyIso, toIsoOrNull } from "./dueDateTime";

describe("dueDateTime", () => {
  it("defaults date-only input to local 10 PM", () => {
    const iso = toIsoOrNull("2026-04-14");

    expect(iso).not.toBeNull();
    if (!iso) throw new Error("Expected an ISO timestamp");

    const local = new Date(iso);
    expect(local.getFullYear()).toBe(2026);
    expect(local.getMonth()).toBe(3);
    expect(local.getDate()).toBe(14);
    expect(local.getHours()).toBe(22);
    expect(local.getMinutes()).toBe(0);
    expect(local.getSeconds()).toBe(0);
    expect(local.getMilliseconds()).toBe(0);
    expect(isDateOnlyIso(iso)).toBe(false);
  });
});
