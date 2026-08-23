import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import GamePage from "@/pages/GamePage";

vi.mock("@/lib/analytics", () => ({
  trackGameExit: vi.fn(),
  trackGameStart: vi.fn(),
}));

describe("game landing page", () => {
  it("shows crawlable mission content before loading the game", () => {
    renderGamePage();

    expect(screen.getByRole("heading", { name: "Chicken Hop", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How to play Chicken Hop" })).toBeInTheDocument();
    expect(screen.getByText("Landing on top of an obstacle is safe.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Hunter Guy/ })).toHaveAttribute("href", "/hunter-guy/");
    expect(screen.queryByTitle("Chicken Hop")).not.toBeInTheDocument();
  });

  it("loads the game only after an explicit play action", () => {
    renderGamePage();

    fireEvent.click(screen.getByRole("button", { name: "Play Chicken Hop" }));

    expect(screen.getByTitle("Chicken Hop")).toHaveAttribute("src", "/games/chicken-hop/");
  });

  it("navigates between related missions with canonical paths", () => {
    renderGamePage();

    fireEvent.click(screen.getByRole("link", { name: /Hunter Guy/ }));

    expect(screen.getByRole("heading", { name: "Hunter Guy", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play Hunter Guy" })).toBeInTheDocument();
  });

  it("wraps related missions at the end of the registry", () => {
    renderGamePage("/torpedo/");

    expect(screen.getByRole("link", { name: /Chicken Hop/ })).toHaveAttribute("href", "/chicken-hop/");
    expect(screen.getByRole("link", { name: /Hunter Guy/ })).toHaveAttribute("href", "/hunter-guy/");
  });

  it("renders a noindex page for an unknown game", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    renderGamePage("/missing-game/");

    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Play/ })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex, follow",
      ),
    );

    consoleError.mockRestore();
  });
});

const renderGamePage = (path = "/chicken-hop/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:gameId" element={<GamePage />} />
      </Routes>
    </MemoryRouter>,
  );
