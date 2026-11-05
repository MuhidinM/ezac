/**
 * Structured data (schema.org JSON-LD) for search and AI engines. The JSON is
 * built from our own constants and published content; "<" is escaped so a
 * value can never close the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  // dangerouslySetInnerHTML is the documented way to emit JSON-LD; the content is escaped above.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
