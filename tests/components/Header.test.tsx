import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Header } from "~/components/common/Header";
import type { AuthUser } from "~/auth/helpers.server";

function renderHeader(user: AuthUser | null = null) {
  const router = createMemoryRouter(
    [
      {
        id: "root",
        path: "/",
        element: <Header user={user} />,
      },
    ],
    { initialEntries: ["/"] }
  );

  return render(<RouterProvider router={router} />);
}

describe("Header component", () => {
  it("renders the Resumint logo and navigation link", () => {
    renderHeader();

    const logo = screen.getByRole("link", { name: /Resumint Home/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveTextContent("Resumint");
  });

  it("renders the theme toggle button with accessible label", () => {
    renderHeader();

    const themeButton = screen.getByRole("button", { name: /switch to/i });
    expect(themeButton).toBeInTheDocument();
  });

  it("renders login and signup links when user is not authenticated", () => {
    renderHeader();

    expect(screen.getByRole("link", { name: /^log in$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^sign up$/i })).toBeInTheDocument();
  });

  it("renders user menu trigger when user is authenticated", () => {
    renderHeader({
      id: "usr_123",
      email: "jane@example.com",
      name: "Jane Doe",
      emailVerified: true,
    });

    expect(screen.getByRole("button", { name: /user menu/i })).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });
});
