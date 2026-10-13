import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { FileQuestion } from "lucide-react";

export function meta() {
  return [
    { title: "404 - Page Not Found | Resumint" },
    { name: "description", content: "The page you requested could not be found." },
  ];
}

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-xs">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground text-sm sm:text-base">
        The link you followed might be broken, or the resume may have been unpublished or removed.
      </p>
      <div className="mt-8">
        <Link to="/">
          <Button>Return to Home</Button>
        </Link>
      </div>
    </div>
  );
}
