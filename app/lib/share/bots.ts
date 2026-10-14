import { isbot } from "isbot";

/**
 * List of known crawlers and social media link preview bots.
 */
const KNOWN_PREVIEW_BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /duckduckbot/i,
  /baiduspider/i,
  /slackbot/i,
  /facebookexternalhit/i,
  /facebot/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /discordbot/i,
  /telegrambot/i,
  /applebot/i,
  /pinterest/i,
  /skypeuripreview/i,
  /embedly/i,
  /quora link preview/i,
  /outbrain/i,
  /vkshare/i,
  /w3c_validator/i,
];

/**
 * Determines if an incoming HTTP request is likely from an automated crawler,
 * link unfurler, prefetcher, or bot.
 *
 * Used to guard the D1 write budget for view counting.
 * When in doubt, returns true (conservative, count nothing).
 */
export function isLikelyBot(request: Request): boolean {
  // 1. HEAD requests are never interactive human page views
  if (request.method.toUpperCase() === "HEAD") {
    return true;
  }

  // 2. Prefetch headers
  const purpose = request.headers.get("purpose") || request.headers.get("sec-purpose");
  if (purpose && purpose.toLowerCase().includes("prefetch")) {
    return true;
  }

  // 3. User-Agent examination
  const userAgent = request.headers.get("user-agent") || "";
  if (!userAgent.trim()) {
    return true;
  }

  // Check known link preview bots explicitly
  for (const pattern of KNOWN_PREVIEW_BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return true;
    }
  }

  // Check comprehensive isbot library
  if (isbot(userAgent)) {
    return true;
  }

  // 4. Accept header examination
  const accept = request.headers.get("accept");
  if (accept) {
    // A standard browser human navigation includes text/html
    const acceptsHtml = accept.includes("text/html") || accept.includes("*/*");
    if (!acceptsHtml) {
      return true;
    }
  }

  return false;
}
