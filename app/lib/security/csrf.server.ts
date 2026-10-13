/**
 * Validates that mutating requests originate from the same origin to prevent CSRF.
 * Throws a 403 Response if a cross-origin request is detected.
 */
export function verifyCsrf(request: Request): void {
  const origin = request.headers.get("Origin");
  const requestUrl = new URL(request.url);

  if (origin) {
    if (origin !== requestUrl.origin) {
      throw new Response("Cross-origin request rejected", { status: 403 });
    }
    return;
  }

  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site" && fetchSite !== "none") {
    throw new Response("Cross-origin request rejected", { status: 403 });
  }

  const referer = request.headers.get("Referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.origin !== requestUrl.origin) {
        throw new Response("Cross-origin request rejected", { status: 403 });
      }
    } catch {
      throw new Response("Invalid referer header", { status: 400 });
    }
  }
}
