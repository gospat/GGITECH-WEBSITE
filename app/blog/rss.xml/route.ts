import { blogPostsMeta } from "@/lib/blog/metadata";
import { absoluteUrl, site } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const items = blogPostsMeta
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      const published = new Date(post.date);

      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escapeXml(post.excerpt)}</description>`,
        `      <category>${escapeXml(post.category)}</category>`,
        Number.isNaN(published.getTime())
          ? ""
          : `      <pubDate>${published.toUTCString()}</pubDate>`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${site.name} Insights`)}</title>
    <link>${absoluteUrl("/blog")}</link>
    <description>${escapeXml(`Engineering notes from ${site.name}.`)}</description>
    <language>en</language>
    <atom:link href="${absoluteUrl("/blog/rss.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
