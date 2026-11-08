import { describe, it, expect } from "vitest";
import { validateProject } from "./validateProject";

const base = { name: "App", mrr: 0, expenses: 0, askingPrice: 0, column: "Building" as const };

describe("validateProject", () => {
  it("requires a name", () => expect(validateProject({ ...base, name: "  " })).toBe("nameRequired"));
  it("rejects negative numbers", () => expect(validateProject({ ...base, mrr: -1 })).toBe("invalidNumber"));
  it("accepts a valid project", () => expect(validateProject(base)).toBeNull());
});
