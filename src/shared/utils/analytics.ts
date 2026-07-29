declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function isAnalyticsAvailable(): boolean {
  const isDev = import.meta.env.DEV as boolean;
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  return !isDev && !!measurementId && typeof window.gtag === 'function';
}

export function trackPageView(path: string): void {
  if (!isAnalyticsAvailable()) return;
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string;
  window.gtag('config', measurementId, {
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
