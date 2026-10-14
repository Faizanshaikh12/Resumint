export function loader() {
  const robots = `User-agent: *
Allow: /
Allow: /build
Allow: /about
Allow: /privacy
Allow: /terms
Disallow: /dashboard
Disallow: /resumes/
Disallow: /api/
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /settings

Sitemap: https://resumint.dev/sitemap.xml
`;

  return new Response(robots, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
