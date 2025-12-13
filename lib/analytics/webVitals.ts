import { event } from "./ga";

export function reportWebVitals(metric: any) {
  const { id, name, label, value } = metric;

  // Round values for GA4
  const roundedValue = name === "CLS" ? value * 1000 : Math.round(value);

  event({
    action: name,
    category: label === "web-vital" ? "Web Vitals" : "Next.js Metrics",
    label: id,
    value: String(roundedValue),
  });
}