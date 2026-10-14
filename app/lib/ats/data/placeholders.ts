export const SAMPLE_PLACEHOLDER_STRINGS = [
  "lorem ipsum",
  "dolor sit amet",
  "your name",
  "first last",
  "firstname lastname",
  "your.email@example.com",
  "email@example.com",
  "user@example.com",
  "sample company",
  "company name",
  "organization name",
  "university name",
  "555-0123",
  "555-0199",
  "555-555-5555",
  "+1 (555) 000-0000",
  "city, state",
  "city, st",
  "your city, st",
  "anytown, usa",
];

export function containsPlaceholderText(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SAMPLE_PLACEHOLDER_STRINGS.some((ph) => lower.includes(ph));
}
