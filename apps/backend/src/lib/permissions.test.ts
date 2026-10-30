import { describe, it, expect } from "vitest";
import { hasMinRole } from "./permissions.js";

describe("hasMinRole", () => {
  it("admin satisfies all roles", () => {
    expect(hasMinRole("admin", "guest")).toBe(true);
    expect(hasMinRole("admin", "user")).toBe(true);
    expect(hasMinRole("admin", "admin")).toBe(true);
  });

  it("user satisfies user and guest", () => {
    expect(hasMinRole("user", "guest")).toBe(true);
    expect(hasMinRole("user", "user")).toBe(true);
    expect(hasMinRole("user", "admin")).toBe(false);
  });

  it("guest satisfies only guest", () => {
    expect(hasMinRole("guest", "guest")).toBe(true);
    expect(hasMinRole("guest", "user")).toBe(false);
    expect(hasMinRole("guest", "admin")).toBe(false);
  });
});