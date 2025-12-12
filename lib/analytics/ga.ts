declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export function pageview(url: string) {
  if (typeof window.gtag === "function") {
    window.gtag("config", process.env.NEXT_PUBLIC_GA_ID as string, {
      page_path: url,
    });
  }
}

export function event({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label: string;
  value: string;
}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
}