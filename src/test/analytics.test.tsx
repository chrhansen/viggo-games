import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GamePage from "@/pages/GamePage";

const analyticsMocks = vi.hoisted(() => ({
  trackGameExit: vi.fn(),
  trackGameStart: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  trackGameExit: analyticsMocks.trackGameExit,
  trackGameStart: analyticsMocks.trackGameStart,
}));

describe("game analytics", () => {
  beforeEach(() => {
    analyticsMocks.trackGameExit.mockReset();
    analyticsMocks.trackGameStart.mockReset();
  });

  it("tracks game start only after the player presses play", () => {
    render(
      <MemoryRouter initialEntries={["/chicken-hop/"]}>
        <Routes>
          <Route path="/:gameId" element={<GamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(analyticsMocks.trackGameStart).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Play Chicken Hop" }));

    expect(analyticsMocks.trackGameStart).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "chicken-hop",
        title: "Chicken Hop",
      }),
    );
  });

  it("tracks game exit when the user confirms leaving", async () => {
    render(
      <MemoryRouter initialEntries={["/chicken-hop/"]}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/:gameId" element={<GamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play Chicken Hop" }));
    fireEvent.click(screen.getByRole("button", { name: "Exit Chicken Hop" }));
    await screen.findByText("Do you want to exit Chicken Hop?");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(analyticsMocks.trackGameExit).not.toHaveBeenCalled();
    expect(screen.getByTitle("Chicken Hop")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Exit Chicken Hop" }));
    await screen.findByText("Do you want to exit Chicken Hop?");
    fireEvent.click(screen.getByRole("button", { name: "Exit Game" }));

    expect(analyticsMocks.trackGameExit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "chicken-hop",
        title: "Chicken Hop",
      }),
    );
    expect(screen.getByRole("button", { name: "Play Chicken Hop" })).toBeInTheDocument();
    expect(screen.queryByTitle("Chicken Hop")).not.toBeInTheDocument();
  });
});
