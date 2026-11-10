import { describe, expect, it } from "vitest";
import { normalizeColumn, COLUMN_IDS } from "@/components/kanban/data";
describe("saved portfolio statuses", () => {
  it("maps legacy valuations to a real Kanban column", () => {
    expect(normalizeColumn("For Sale")).toBe("Listed");
  });
  it.each(COLUMN_IDS)("preserves %s", status => expect(normalizeColumn(status)).toBe(status));
  it("does not crash on an unknown persisted status", () => expect(normalizeColumn("unknown")).toBe("Building"));
});
