import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Header } from "~/components/common/Header";

describe("Header component", () => {
  it("renders the Resumint logo and navigation link", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const logo = screen.getByRole("link", { name: /Resumint Home/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveTextContent("Resumint");
  });

  it("renders the theme toggle button with accessible label", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const themeButton = screen.getByRole("button", { name: /switch to/i });
    expect(themeButton).toBeInTheDocument();
  });
});
