export function loader() {
  const baseUrl = "https://resumint.dev";
  const pages = [
    { loc: `${baseUrl}/`, priority: "1.0", changefreq: "weekly" },
    { loc: `${baseUrl}/build`, priority: "0.9", changefreq: "weekly" },
    { loc: `${baseUrl}/about`, priority: "0.7", changefreq: "monthly" },
    { loc: `${baseUrl}/privacy`, priority: "0.5", changefreq: "monthly" },
    { loc: `${baseUrl}/terms`, priority: "0.5", changefreq: "monthly" },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
