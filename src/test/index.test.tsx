import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Index from "@/pages/Index";

describe("homepage game cards", () => {
  it("links to the canonical game landing route", () => {
    renderHomepage();

    const chickenHopLink = screen.getByRole("link", { name: /Chicken Hop/ });
    expect(chickenHopLink).toHaveAttribute("href", "/chicken-hop/");

    fireEvent.click(chickenHopLink);

    expect(screen.getByText("Chicken Hop landing route")).toBeInTheDocument();
  });

  it("serves responsive artwork and defers below-the-fold cards", () => {
    renderHomepage();

    const chickenHopImage = screen.getByAltText(
      "Clockwork chicken jumping between platforms in Chicken Hop artwork",
    );
    expect(chickenHopImage).toHaveAttribute("srcset", expect.stringContaining("768w"));
    expect(chickenHopImage).toHaveAttribute("srcset", expect.stringContaining("1376w"));
    expect(chickenHopImage).toHaveAttribute("loading", "eager");
    expect(chickenHopImage).toHaveAttribute("width", "1376");
    expect(chickenHopImage).toHaveAttribute("height", "768");

    expect(
      screen.getByAltText("Submarine firing torpedoes in an icy underwater cavern in Torpedo artwork"),
    ).toHaveAttribute("loading", "lazy");
  });
});

const renderHomepage = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/chicken-hop" element={<div>Chicken Hop landing route</div>} />
      </Routes>
    </MemoryRouter>,
  );
