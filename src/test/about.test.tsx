import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import About from "@/pages/About";
import Index from "@/pages/Index";

describe("about page", () => {
  it("navigates from the homepage footer link", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "About" }));

    expect(await screen.findByRole("heading", { name: "About" })).toBeInTheDocument();
  });

  it("renders the source link", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <Routes>
          <Route path="/about" element={<About />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /github.com\/chrhansen\/viggo-games/i })).toHaveAttribute(
      "href",
      "https://github.com/chrhansen/viggo-games",
    );
  });
});
