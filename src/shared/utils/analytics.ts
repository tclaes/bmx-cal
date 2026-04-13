declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const IS_DEV = import.meta.env.DEV as boolean;

function isAnalyticsAvailable(): boolean {
  return !IS_DEV && !!GA_MEASUREMENT_ID && typeof window.gtag === 'function';
}

export function trackPageView(path: string): void {
  if (!isAnalyticsAvailable()) return;

  window.gtag('config', GA_MEASUREMENT_ID!, {
    page_path: path,
  });
}

export function trackEvent(category: string, action: string, label?: string, value?: number): void {
  if (!isAnalyticsAvailable()) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
}
