import { describe, it, expect } from "vitest";
import { parsePhotos } from "./parsePhotos";

describe("parsePhotos", () => {
  it("returns [] for null/undefined", () => {
    expect(parsePhotos(null)).toEqual([]);
    expect(parsePhotos(undefined)).toEqual([]);
  });

  it("filters falsy entries out of arrays", () => {
    expect(parsePhotos(["a", "", null, "b"])).toEqual(["a", "b"]);
  });

  it("parses a Postgres array-literal string", () => {
    expect(parsePhotos('{"https://x/a.jpg","https://x/b.jpg"}')).toEqual([
      "https://x/a.jpg",
      "https://x/b.jpg",
    ]);
  });

  it("returns [] for an empty string", () => {
    expect(parsePhotos("")).toEqual([]);
  });
});
