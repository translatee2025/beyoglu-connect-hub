import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SafeImage } from "./SafeImage";

describe("SafeImage", () => {
  it("renders an <img> when src is provided", () => {
    render(<SafeImage src="https://example.com/a.jpg" alt="a" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/a.jpg");
  });

  it("renders the placeholder (no <img>) when src is missing", () => {
    render(<SafeImage src={null} alt="none" fallbackEmoji="📷" />);
    expect(screen.queryByRole("img")).toBeNull();
  });

  // Regression guard for the disappearing-images fix: a transient load error
  // must NOT permanently hide a subsequently-valid src.
  it("recovers when src changes after a load error", () => {
    const { rerender } = render(<SafeImage src="https://example.com/broken.jpg" alt="p" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).toBeNull(); // errored -> placeholder

    rerender(<SafeImage src="https://example.com/good.jpg" alt="p" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/good.jpg");
  });
});
