/**
 * Expiry Presets and Calculation
 *
 * Sets expiration to UTC end-of-day (23:59:59.999Z).
 * Rejects past dates.
 */

export type ExpiryPreset = "7d" | "30d" | "90d" | "never" | "custom";

export interface CalculateExpiryResult {
  ok: boolean;
  expiresAt: Date | null;
  error?: string;
}

/**
 * Returns a new Date object representing the end of the day in UTC (23:59:59.999Z).
 */
export function getUtcEndOfDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
}

/**
 * Calculates the UTC end-of-day timestamp for a preset or custom date.
 */
export function calculateExpiryTimestamp(
  preset: ExpiryPreset,
  customDateStr?: string | null,
  now: Date = new Date()
): CalculateExpiryResult {
  if (preset === "never") {
    return { ok: true, expiresAt: null };
  }

  const todayUtcEnd = getUtcEndOfDay(now);

  if (preset === "7d") {
    const target = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return { ok: true, expiresAt: getUtcEndOfDay(target) };
  }

  if (preset === "30d") {
    const target = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return { ok: true, expiresAt: getUtcEndOfDay(target) };
  }

  if (preset === "90d") {
    const target = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    return { ok: true, expiresAt: getUtcEndOfDay(target) };
  }

  if (preset === "custom") {
    if (!customDateStr || !customDateStr.trim()) {
      return { ok: false, expiresAt: null, error: "Custom expiration date is required" };
    }

    // Expecting YYYY-MM-DD format
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(customDateStr.trim());
    if (!match) {
      return { ok: false, expiresAt: null, error: "Date must be in YYYY-MM-DD format" };
    }

    const year = parseInt(match[1]!, 10);
    const month = parseInt(match[2]!, 10) - 1;
    const day = parseInt(match[3]!, 10);

    const parsedDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    if (
      isNaN(parsedDate.getTime()) ||
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month ||
      parsedDate.getUTCDate() !== day
    ) {
      return { ok: false, expiresAt: null, error: "Invalid calendar date" };
    }

    // Must not be in the past compared to today's start of day
    const startOfTodayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
    );

    if (parsedDate.getTime() < startOfTodayUtc.getTime()) {
      return { ok: false, expiresAt: null, error: "Expiration date cannot be in the past" };
    }

    return { ok: true, expiresAt: parsedDate };
  }

  return { ok: false, expiresAt: null, error: "Unknown expiry preset" };
}

/**
 * Returns a human-friendly description of remaining validity.
 */
export function formatExpiryRemaining(
  expiresAt: Date | string | null | undefined,
  now: Date = new Date()
): string {
  if (!expiresAt) return "Never expires";
  const exp = new Date(expiresAt).getTime();
  const diffMs = exp - now.getTime();

  if (diffMs <= 0) return "Expired";

  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 1) return "Expires in 1 day";
  return `Expires in ${diffDays} days`;
}
