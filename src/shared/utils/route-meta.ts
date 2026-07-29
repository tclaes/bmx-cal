export const routeMeta: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'BMX Calendar - BMX events, races and competitions in Belgium',
    description: 'Discover upcoming BMX races, cups and shows across Belgium. Browse the shared calendar by date, club or type, build a personal schedule and export it to your calendar app.',
  },
  '/my-events': {
    title: 'Create my BMX calendar - BMX Calendar',
    description: 'Build a personal BMX season calendar: pick your races, export to Apple, Google or Outlook, and never miss a registration deadline.',
  },
  '/about': {
    title: 'About - BMX Calendar',
    description: 'Learn about BMX Calendar, a community project for Belgian BMX events.',
  },
  '/guide': {
    title: 'BMX Racing Guide - BMX Calendar',
    description: 'A complete beginner guide to BMX racing in Belgium: event types, categories, registration, equipment, and useful links.',
  },
  '/faq': {
    title: 'BMX Racing FAQ - BMX Calendar',
    description: 'Frequently asked questions about BMX racing in Belgium: age requirements, costs, licensing, race format, and rankings.',
  },
  '/race-day': {
    title: 'Race Day Checklist - BMX Calendar',
    description: 'Everything you need for a BMX race day: preparation checklist, race format, nutrition tips, and weather advice.',
  },
  '/tracks': {
    title: 'BMX Tracks in Belgium - BMX Calendar',
    description: 'Discover BMX tracks across Belgium: locations, track features, and club information for over 15 circuits.',
  },
  '/get-in-touch': {
    title: 'Get in touch - BMX Calendar',
    description: 'Contact the BMX Calendar team for questions, feedback or partnerships.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy - BMX Calendar',
    description: 'How BMX Calendar handles your personal data, cookies and advertising.',
  },
  '/terms': {
    title: 'Terms of Service - BMX Calendar',
    description: 'The terms and conditions for using BMX Calendar.',
  },
  '/report-bug': {
    title: 'Report a bug - BMX Calendar',
    description: 'Report an issue or suggest improvements for BMX Calendar.',
  },
};

// Routes that are utility/auth screens with no publisher content.
// AdSense must not serve ads on these pages.
export const NO_AD_ROUTES = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/profile',
  '/my-events',
  '/team-manager',
  '/admin',
  '/admin/login',
]);

const DEFAULT_META = {
  title: 'BMX Calendar',
  description: 'BMX events, races and competitions in Belgium.',
};

export function updateDocumentMeta(path: string) {
  const meta = routeMeta[path] ?? DEFAULT_META;
  document.title = meta.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', meta.description);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', `https://bmxkalender.be${path === '/' ? '/' : path}`);
}
