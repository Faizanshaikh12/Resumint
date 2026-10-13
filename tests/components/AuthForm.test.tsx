import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AuthForm } from "~/components/auth/AuthForm";

describe("AuthForm Component", () => {
  it("renders signin mode by default with email, password, and signin button", () => {
    render(
      <MemoryRouter>
        <AuthForm mode="signin" />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
  });

  it("renders signup mode with Full Name, email, and password", () => {
    render(
      <MemoryRouter>
        <AuthForm mode="signup" />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows validation error messages when submitting empty form", async () => {
    render(
      <MemoryRouter>
        <AuthForm mode="signin" />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole("button", { name: /^sign in$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it("toggles password visibility between masked and plain text", () => {
    render(
      <MemoryRouter>
        <AuthForm mode="signin" />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/^password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: /show password/i });
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("supports compact mode without headers for modal dialog embedding", () => {
    render(
      <MemoryRouter>
        <AuthForm mode="signin" compact={true} />
      </MemoryRouter>
    );

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });
});
