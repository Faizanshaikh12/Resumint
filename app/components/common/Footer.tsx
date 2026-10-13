import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-muted/20 py-8 text-center text-sm text-muted-foreground">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 gap-4">
        <p>
          © {new Date().getFullYear()} Resumint. Built with craft on Cloudflare Workers & React
          Router v7.
        </p>
        <div className="flex items-center gap-6">
          <Link to="/health" className="hover:text-foreground underline-offset-4 hover:underline">
            System Health
          </Link>
          <a
            href="https://github.com/Faizanshaikh12/Resumint"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
