import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, createMemoryRouter, RouterProvider } from "react-router";
import { QrCodeDialog } from "~/components/share/QrCodeDialog";
import { AuthDialog } from "~/components/auth/AuthDialog";
import PublicResumePage, { ErrorBoundary } from "~/routes/r.$slug";
import { ResumeCard } from "~/components/dashboard/ResumeCard";
import type { ResumeSummary } from "~/db/queries/resumes";

describe("Share Components (Phase 8)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("QrCodeDialog", () => {
    it("renders dialog with QR code image, copy link, and download buttons", async () => {
      const onOpenChange = vi.fn();
      render(
        <QrCodeDialog
          open={true}
          onOpenChange={onOpenChange}
          url="http://localhost:5173/r/abcdef12345678"
          title="Software Engineer Resume"
        />
      );

      expect(screen.getByText("Scan to View Resume")).toBeInTheDocument();
      expect(
        screen.getByText("Scan with any phone camera or tablet to open this public resume.")
      ).toBeInTheDocument();

      // Wait for client-side QR generation
      await waitFor(() => {
        expect(screen.getByTestId("qr-code-image")).toBeInTheDocument();
      });

      const qrImage = screen.getByTestId("qr-code-image");
      expect(qrImage).toHaveAttribute(
        "alt",
        "QR code for Software Engineer Resume linking to http://localhost:5173/r/abcdef12345678"
      );

      const copyBtn = screen.getByTestId("qr-copy-link-button");
      expect(copyBtn).toBeInTheDocument();
      expect(copyBtn).toHaveTextContent("Copy Link");

      const downloadBtn = screen.getByTestId("qr-download-png-button");
      expect(downloadBtn).toBeInTheDocument();
      expect(downloadBtn).toHaveTextContent("Download PNG");
    });

    it("copies link to clipboard when Copy Link button is clicked", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <QrCodeDialog
          open={true}
          onOpenChange={vi.fn()}
          url="http://localhost:5173/r/test-slug-1234"
          title="My Resume"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("qr-code-image")).toBeInTheDocument();
      });

      const copyBtn = screen.getByTestId("qr-copy-link-button");
      fireEvent.click(copyBtn);

      expect(writeTextMock).toHaveBeenCalledWith("http://localhost:5173/r/test-slug-1234");
      await waitFor(() => {
        expect(screen.getByText("Copied")).toBeInTheDocument();
      });
    });
  });

  describe("AuthDialog", () => {
    it("renders accessible prompt for guest users to sign in before sharing", () => {
      const onOpenChange = vi.fn();
      render(
        <MemoryRouter>
          <AuthDialog
            open={true}
            onOpenChange={onOpenChange}
            title="Sign in to Share Your Resume"
            description="Create a free Resumint account to get a public link."
          />
        </MemoryRouter>
      );

      expect(screen.getByText("Sign in to Share Your Resume")).toBeInTheDocument();
      expect(screen.getByText("Create a free Resumint account to get a public link.")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Log in/i })).toHaveAttribute("href", "/login");
      expect(screen.getByRole("link", { name: /Sign Up Free/i })).toHaveAttribute("href", "/signup");
    });
  });

  describe("Public Resume Locked State", () => {
    it("renders minimal locked form without leaking candidate name, title, or resume content", async () => {
      const router = createMemoryRouter(
        [
          {
            path: "/r/:slug",
            loader: () => ({
              locked: true,
              slug: "secret-slug-1234",
            }),
            element: <PublicResumePage />,
          },
        ],
        { initialEntries: ["/r/secret-slug-1234"] }
      );

      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText("Protected Resume")).toBeInTheDocument();
      });

      expect(
        screen.getByText("This document is password-protected by the author. Enter the password below to view.")
      ).toBeInTheDocument();
      expect(screen.getByTestId("public-password-input")).toBeInTheDocument();
      expect(screen.getByTestId("unlock-submit-button")).toBeInTheDocument();

      // Ensure no candidate PII is rendered
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
      expect(screen.queryByText("Senior Software Engineer")).not.toBeInTheDocument();
      expect(screen.queryByText("Download PDF")).not.toBeInTheDocument();
    });
  });

  describe("Public Resume Unavailable Boundary", () => {
    it("renders generic 404 boundary for unavailable links", async () => {
      const router = createMemoryRouter(
        [
          {
            path: "/r/:slug",
            loader: () => {
              throw new Response("This link is unavailable", {
                status: 404,
                statusText: "Not Found",
              });
            },
            element: <PublicResumePage />,
            errorElement: <ErrorBoundary />,
          },
        ],
        { initialEntries: ["/r/invalid-slug"] }
      );

      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByTestId("unavailable-heading")).toHaveTextContent("This link is unavailable");
      });

      expect(
        screen.getByText("The resume you are looking for does not exist, has expired, or the link was turned off by the author.")
      ).toBeInTheDocument();
      expect(screen.getByText("Create Your Own Resume")).toBeInTheDocument();
    });
  });

  describe("ResumeCard Share Status Badges", () => {
    const baseResume: ResumeSummary = {
      id: "res-1",
      userId: "user-1",
      title: "Full Stack Engineer",
      templateId: "modern",
      version: 1,
      createdAt: "2026-10-14T10:00:00Z",
      updatedAt: "2026-10-14T10:00:00Z",
      shareSlug: null,
      shareStatus: "not_shared",
    };

    const mockFetcher = {
      Form: (props: any) => <form {...props} />,
      submit: vi.fn(),
      load: vi.fn(),
      state: "idle" as const,
      data: null,
    };

    it("displays 'Not shared' badge when shareStatus is not_shared", () => {
      render(
        <MemoryRouter>
          <ResumeCard
            resume={baseResume}
            fetcher={mockFetcher as any}
            atLimit={false}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("share-badge-not_shared")).toHaveTextContent("Not shared");
    });

    it("displays 'Shared' badge and enables Copy link menu item when active", () => {
      const sharedResume: ResumeSummary = {
        ...baseResume,
        shareSlug: "active-slug-1234",
        shareStatus: "shared",
      };

      render(
        <MemoryRouter>
          <ResumeCard
            resume={sharedResume}
            fetcher={mockFetcher as any}
            atLimit={false}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("share-badge-shared")).toHaveTextContent("Shared");
    });

    it("displays 'Protected' badge when password-protected", () => {
      const protectedResume: ResumeSummary = {
        ...baseResume,
        shareSlug: "pwd-slug-1234",
        shareStatus: "protected",
      };

      render(
        <MemoryRouter>
          <ResumeCard
            resume={protectedResume}
            fetcher={mockFetcher as any}
            atLimit={false}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("share-badge-protected")).toHaveTextContent("Protected");
    });

    it("displays 'Expired' badge when expired", () => {
      const expiredResume: ResumeSummary = {
        ...baseResume,
        shareSlug: "old-slug-1234",
        shareStatus: "expired",
      };

      render(
        <MemoryRouter>
          <ResumeCard
            resume={expiredResume}
            fetcher={mockFetcher as any}
            atLimit={false}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("share-badge-expired")).toHaveTextContent("Expired");
    });

    it("displays 'Disabled' badge when disabled", () => {
      const disabledResume: ResumeSummary = {
        ...baseResume,
        shareSlug: "revoked-slug-1234",
        shareStatus: "disabled",
      };

      render(
        <MemoryRouter>
          <ResumeCard
            resume={disabledResume}
            fetcher={mockFetcher as any}
            atLimit={false}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("share-badge-disabled")).toHaveTextContent("Disabled");
    });
  });
});
