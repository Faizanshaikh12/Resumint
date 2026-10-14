import { Globe, Link as LinkIcon } from "lucide-react";
import type { ResumeLink } from "~/lib/schemas/resume";
import { sanitizeHref, formatLinkDisplay } from "~/lib/resume/sanitize-link";

export interface LinkListProps {
  links?: ResumeLink[];
  className?: string;
  showIcons?: boolean;
}

export function LinkList({ links, className = "", showIcons = true }: LinkListProps) {
  if (!links || links.length === 0) return null;

  const validLinks = links.filter((l) => l && l.url && l.url.trim().length > 0);
  if (validLinks.length === 0) return null;

  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1 list-none p-0 m-0 ${className}`}>
      {validLinks.map((link) => {
        const href = sanitizeHref(link.url);
        const display = formatLinkDisplay(link.url, link.label);
        if (!href) return null;

        return (
          <li key={link.id || link.url} className="inline-flex items-center gap-1.5 text-sm">
            {showIcons && (
              <span className="text-neutral-500 shrink-0 select-none" aria-hidden="true">
                {link.url.includes("github.com") || link.url.includes("linkedin.com") ? (
                  <Globe className="w-3.5 h-3.5" />
                ) : (
                  <LinkIcon className="w-3.5 h-3.5" />
                )}
              </span>
            )}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-700 hover:text-blue-600 underline decoration-neutral-300 underline-offset-2 transition-colors"
            >
              {display}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
