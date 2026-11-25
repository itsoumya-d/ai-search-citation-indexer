import { describe, it, expect } from "vitest";
import { VERSION } from "../src/index.js";

describe("Smoke test", () => {
  it("exports correct version", () => {
    expect(VERSION).toBe("1.0.0");
  });
});
