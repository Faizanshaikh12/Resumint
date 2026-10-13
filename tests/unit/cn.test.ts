import { describe, it, expect } from "vitest";
import { cn } from "~/lib/utils/cn";

describe("cn utility", () => {
  it("merges standard class names correctly", () => {
    const result = cn("px-2 py-1", "bg-primary text-white");
    expect(result).toBe("px-2 py-1 bg-primary text-white");
  });

  it("handles conditional classes and falsy values", () => {
    const isActive = false;
    const isPrimary = true;
    const result = cn("btn", isActive && "btn-active", isPrimary && "btn-primary", null, undefined);
    expect(result).toBe("btn btn-primary");
  });

  it("resolves Tailwind conflicts using tailwind-merge", () => {
    const result = cn("p-4", "p-8");
    expect(result).toBe("p-8");
  });
});
