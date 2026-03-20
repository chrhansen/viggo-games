import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PageviewTracker from "@/components/PageviewTracker";

const analyticsMocks = vi.hoisted(() => ({
  trackPageview: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  trackPageview: analyticsMocks.trackPageview,
}));

const Home = () => {
  const navigate = useNavigate();

  return (
    <button type="button" onClick={() => navigate("/about?tab=team#crew")}>
      About
    </button>
  );
};

describe("pageview tracker", () => {
  beforeEach(() => {
    analyticsMocks.trackPageview.mockReset();
  });

  it("tracks client-side route changes after the initial page load", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <PageviewTracker />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<div>About</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(analyticsMocks.trackPageview).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "About" }));

    expect(analyticsMocks.trackPageview).toHaveBeenCalledTimes(1);
  });
});
