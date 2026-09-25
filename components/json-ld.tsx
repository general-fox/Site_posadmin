/** Escape HTML delimiters so content cannot end the structured-data script. */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data)?.replace(/</g, "\\u003c");
  if (!json) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
