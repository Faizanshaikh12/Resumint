import { Link, Form, useMatches } from "react-router";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { FileText, User as UserIcon, LogOut, LayoutDashboard, Settings } from "lucide-react";
import type { AuthUser } from "~/auth/helpers.server";

export function Header({ user: propUser }: { user?: AuthUser | null } = {}) {
  const matches = useMatches();
  const rootMatch = matches.find((m) => m.id === "root");
  const rootUser = (rootMatch?.data as { user?: AuthUser | null } | undefined)?.user;
  const user = propUser !== undefined ? propUser : (rootUser ?? null);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-md"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground transition-opacity hover:opacity-90"
            aria-label="Resumint Home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
            <span>Resumint</span>
          </Link>

          <nav
            className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground"
            aria-label="Main Navigation"
          >
            <Link to="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
            <Link to="/#templates" className="transition-colors hover:text-foreground">
              Templates
            </Link>
            <Link to="/#features" className="transition-colors hover:text-foreground">
              Features
            </Link>
            <Link to="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
            {user && (
              <Link to="/dashboard" className="transition-colors hover:text-foreground">
                Dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label="User menu"
                    className="flex h-9 items-center gap-2 rounded-full border border-border px-3 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <UserIcon className="h-4 w-4 text-primary" />
                    <span className="max-w-[120px] truncate">{user.name}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2">
                    <div className="border-b pb-2 mb-1 px-2">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuItem>
                      <Link to="/dashboard" className="flex items-center gap-2 w-full">
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link to="/settings" className="flex items-center gap-2 w-full">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Form method="post" action="/logout" className="w-full">
                        <button
                          type="submit"
                          className="flex items-center gap-2 w-full text-destructive text-left cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Log out</span>
                        </button>
                      </Form>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link to="/resumes/new" className="hidden sm:inline-flex">
                  <Button size="sm" className="font-medium shadow-xs">
                    New Resume
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-medium">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup" className="hidden sm:inline-flex">
                  <Button variant="outline" size="sm" className="font-medium">
                    Sign up
                  </Button>
                </Link>
                <Link to="/build">
                  <Button size="sm" className="font-medium shadow-xs">
                    Build Resume
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
