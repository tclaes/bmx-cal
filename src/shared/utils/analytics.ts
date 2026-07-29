declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function isAnalyticsAvailable(): boolean {
  return !import.meta.env.DEV && !!import.meta.env.VITE_GA_MEASUREMENT_ID && typeof window.gtag === 'function';
}

export function trackPageView(path: string): void {
  if (!isAnalyticsAvailable()) return;

  window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID as string, {
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
