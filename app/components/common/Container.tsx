import * as React from "react";
import { cn } from "~/lib/utils";

export function Container({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl", className)} {...props}>
      {children}
    </div>
  );
}
