// Ensure Node/Worker global process env reflects test mode so libraries
// (like Better Auth) identify the test environment and resolve fallback client IPs
if (typeof (globalThis as any).process === "undefined") {
  (globalThis as any).process = { env: {} };
}
(globalThis as any).process.env = {
  ...((globalThis as any).process.env || {}),
  NODE_ENV: "test",
  TEST: "true",
};
