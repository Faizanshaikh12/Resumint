/**
 * Maximum number of resumes an individual user can own on the Cloudflare Free Tier.
 * Enforced across create, duplicate, and guest draft claim flows to protect D1 storage.
 */
export const MAX_RESUMES_PER_USER = 20;
