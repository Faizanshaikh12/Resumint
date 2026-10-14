import { formatDateRange, type DateRange } from "~/lib/resume/dates";

export interface ItemDateProps {
  date?: DateRange | { start?: string; end?: string; current?: boolean } | string | null;
  dateStyle?: string;
  className?: string;
}

export function ItemDate({ date, dateStyle = "MMM YYYY", className = "" }: ItemDateProps) {
  if (!date) return null;

  let text = "";
  if (typeof date === "string") {
    text = date;
  } else {
    text = formatDateRange(date, dateStyle);
  }

  if (!text) return null;

  return (
    <span className={`text-sm text-neutral-600 font-normal shrink-0 ${className}`}>
      {text}
    </span>
  );
}
