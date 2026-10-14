import * as React from "react";
import { cn } from "~/lib/utils";

interface DropdownContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = React.createContext<DropdownContextType | undefined>(undefined);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={menuRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu");

  return (
    <button
      type="button"
      className={cn("inline-flex items-center", className)}
      onClick={() => context.setOpen(!context.open)}
      aria-expanded={context.open}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className,
  align = "end",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end" | "center";
} & React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu");

  if (!context.open) return null;

  const alignStyles = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 -translate-x-1/2",
  }[align];

  return (
    <div
      role="menu"
      className={cn(
        "absolute z-50 mt-2 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md transition-all",
        alignStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(DropdownContext);

  return (
    <div
      role="menuitem"
      tabIndex={0}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        context?.setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
          context?.setOpen(false);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}
