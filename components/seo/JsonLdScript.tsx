import Script from "next/script";

interface JsonLdScriptProps {
  data: Record<string, unknown>;
  id?: string;
}

export function JsonLdScript({ data, id = "json-ld" }: JsonLdScriptProps) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
      strategy="afterInteractive"
    />
  );
}