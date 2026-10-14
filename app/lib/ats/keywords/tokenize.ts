export const MAX_JD_LENGTH = 10000;

// Known multi-character technical tokens with punctuation
const PROTECTED_TOKENS: { pattern: RegExp; canonical: string }[] = [
  { pattern: /\bc\+\+/gi, canonical: "c++" },
  { pattern: /\bc#/gi, canonical: "c#" },
  { pattern: /(^|[\s,;(])(\.net)\b/gi, canonical: ".net" },
  { pattern: /\bnode\.js\b/gi, canonical: "node.js" },
  { pattern: /\bnext\.js\b/gi, canonical: "next.js" },
  { pattern: /\bvue\.js\b/gi, canonical: "vue.js" },
  { pattern: /\bexpress\.js\b/gi, canonical: "express.js" },
  { pattern: /\bnest\.js\b/gi, canonical: "nest.js" },
  { pattern: /\bci\/cd\b/gi, canonical: "ci/cd" },
  { pattern: /\bui\/ux\b/gi, canonical: "ui/ux" },
  { pattern: /\ba\/b\s+testing\b/gi, canonical: "a/b testing" },
  { pattern: /\bwi-fi\b/gi, canonical: "wi-fi" },
  { pattern: /\btcp\/ip\b/gi, canonical: "tcp/ip" },
  { pattern: /\bobjective-c\b/gi, canonical: "objective-c" },
];

/**
 * Tokenize input text (resume or job description) into normalized words and phrases.
 * Preserves technical symbols (C++, C#, .NET, CI/CD, Node.js) and strips URLs/emails.
 */
export function tokenize(rawText: string): string[] {
  if (!rawText) return [];

  // Cap length to protect performance against enormous inputs
  const text = rawText.slice(0, MAX_JD_LENGTH);

  // Strip URLs and emails
  const clean = text
    .replace(/https?:\/\/[^\s]+/gi, " ")
    .replace(/www\.[^\s]+/gi, " ")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, " ");

  // Map protected tokens to safe placeholders
  const placeholderMap = new Map<string, string>();
  let transformed = clean;

  PROTECTED_TOKENS.forEach(({ pattern, canonical }, idx) => {
    const placeholder = `__prot_${idx}__`;
    placeholderMap.set(placeholder, canonical);
    transformed = transformed.replace(pattern, (match, prefix, capturedDotnet) => {
      if (canonical === ".net") {
        return `${prefix || ""}${placeholder}`;
      }
      return placeholder;
    });
  });

  // Normalize Unicode apostrophes/quotes to simple space or quote
  transformed = transformed
    .replace(/[’']/g, "'")
    .replace(/[“”"]/g, " ")
    .toLowerCase();

  // Match words: letters, numbers, hyphens within words, and placeholders
  // We match [a-z0-9]+(-[a-z0-9]+)* or placeholders
  const rawTokens = transformed.match(/__prot_\d+__|[a-z0-9]+(?:-[a-z0-9]+)*/gi) || [];

  const tokens: string[] = [];
  for (const t of rawTokens) {
    if (placeholderMap.has(t)) {
      tokens.push(placeholderMap.get(t)!);
    } else {
      // Clean isolated hyphens or punctuation
      const trimmed = t.replace(/^-+|-+$/g, "");
      if (trimmed.length > 0) {
        tokens.push(trimmed);
      }
    }
  }

  return tokens;
}
