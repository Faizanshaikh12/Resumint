import { Link } from "react-router";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "~/components/ui/button";
import { FileText } from "lucide-react";

export function Header() {
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
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/resumes/new">
              <Button size="sm" className="font-medium shadow-xs">
                Build Resume
              </Button>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
