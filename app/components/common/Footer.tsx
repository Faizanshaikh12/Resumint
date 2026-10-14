import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-muted/20 py-10 text-sm text-muted-foreground">
      <div className="container mx-auto px-4 sm:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Resumint</span>
            <span>·</span>
            <span>Honest, Open-Source Resume Builder</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm" aria-label="Footer Navigation">
            <Link to="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/health" className="hover:text-foreground transition-colors">
              System Health
            </Link>
            <a
              href="https://github.com/Faizanshaikh12/Resumint"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>

        <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Resumint. Built with craft on Cloudflare Workers & React Router v7.</p>
          <p className="text-center sm:text-right">
            The ATS checklist score is an educational heuristic guide, not an employment guarantee.
          </p>
        </div>
      </div>
    </footer>
  );
}
