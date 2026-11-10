import type { ComponentType } from 'svelte';
import CalendarView from '@features/calendar/CalendarView.svelte';
import AdminDashboard from '@features/admin/AdminDashboard.svelte';
import Login from '@features/admin/Login.svelte';
import MyEventsPage from '@features/my-events/MyEventsPage.svelte';
import MyEventsDemoPage from '@features/my-events/MyEventsDemoPage.svelte';
import RegisterPage from '@features/auth/RegisterPage.svelte';
import LoginPage from '@features/auth/LoginPage.svelte';
import ForgotPasswordPage from '@features/auth/ForgotPasswordPage.svelte';
import ResetPasswordPage from '@features/auth/ResetPasswordPage.svelte';
import ProfilePage from '@features/profile/ProfilePage.svelte';
import TeamManagerDashboard from '@features/team-manager/TeamManagerDashboard.svelte';
import BugReportPage from '@features/bug-report/BugReportPage.svelte';
import AboutPage from '@features/about/AboutPage.svelte';
import GetInTouchPage from '@features/about/GetInTouchPage.svelte';
import GuidePage from '@features/guide/GuidePage.svelte';
import FaqPage from '@features/guide/FaqPage.svelte';
import RaceDayPage from '@features/guide/RaceDayPage.svelte';
import TracksPage from '@features/guide/TracksPage.svelte';
import NewsPage from '@features/news/NewsPage.svelte';
import NewsArticlePage from '@features/news/NewsArticlePage.svelte';
import PrivacyPolicyPage from '@features/legal/PrivacyPolicyPage.svelte';
import TermsPage from '@features/legal/TermsPage.svelte';

export type AccessRule = 'public' | 'authenticated' | 'admin' | 'teamManager';

export interface RouteMeta {
  title: string;
  description: string;
}

export interface RouteDefinition {
  path: string;
  component: ComponentType;
  access?: AccessRule;
  /** Component rendered when the access rule fails. */
  fallback?: ComponentType;
  meta?: RouteMeta;
  /** Route is matched as a prefix (e.g. /news/:slug). */
  prefix?: boolean;
}

export const routes: RouteDefinition[] = [
  {
    path: '/',
    component: CalendarView,
    meta: {
      title: 'BMX Calendar - BMX events, races and competitions in Belgium',
      description:
        'Discover upcoming BMX races, cups and shows across Belgium. Browse the shared calendar by date, club or type, build a personal schedule and export it to your calendar app.',
    },
  },
  {
    path: '/my-events',
    component: MyEventsPage,
    access: 'authenticated',
    fallback: MyEventsDemoPage,
    meta: {
      title: 'Create my BMX calendar - BMX Calendar',
      description:
        'Build a personal BMX season calendar: pick your races, export to Apple, Google or Outlook, and never miss a registration deadline.',
    },
  },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { path: '/forgot-password', component: ForgotPasswordPage },
  { path: '/reset-password', component: ResetPasswordPage },
  {
    path: '/admin/login',
    component: Login,
  },
  {
    path: '/admin',
    component: AdminDashboard,
    access: 'admin',
    fallback: Login,
  },
  {
    path: '/profile',
    component: ProfilePage,
    access: 'authenticated',
    fallback: LoginPage,
  },
  {
    path: '/team-manager',
    component: TeamManagerDashboard,
    access: 'teamManager',
    fallback: LoginPage,
  },
  { path: '/report-bug', component: BugReportPage },
  {
    path: '/about',
    component: AboutPage,
    meta: {
      title: 'About - BMX Calendar',
      description: 'Learn about BMX Calendar, a community project for Belgian BMX events.',
    },
  },
  {
    path: '/guide',
    component: GuidePage,
    meta: {
      title: 'BMX Racing Guide - BMX Calendar',
      description:
        'A complete beginner guide to BMX racing in Belgium: event types, categories, registration, equipment, and useful links.',
    },
  },
  {
    path: '/faq',
    component: FaqPage,
    meta: {
      title: 'BMX Racing FAQ - BMX Calendar',
      description:
        'Frequently asked questions about BMX racing in Belgium: age requirements, costs, licensing, race format, and rankings.',
    },
  },
  {
    path: '/race-day',
    component: RaceDayPage,
    meta: {
      title: 'Race Day Checklist - BMX Calendar',
      description:
        'Everything you need for a BMX race day: preparation checklist, race format, nutrition tips, and weather advice.',
    },
  },
  {
    path: '/tracks',
    component: TracksPage,
    meta: {
      title: 'BMX Tracks in Belgium - BMX Calendar',
      description:
        'Discover BMX tracks across Belgium: locations, track features, and club information for over 15 circuits.',
    },
  },
  {
    path: '/news',
    component: NewsPage,
    meta: {
      title: 'News & Updates - BMX Calendar',
      description:
        'Stay up to date with the latest features, improvements, and announcements from BMX Calendar.',
    },
  },
  {
    path: '/news/:slug',
    component: NewsArticlePage,
    prefix: true,
  },
  {
    path: '/get-in-touch',
    component: GetInTouchPage,
    meta: {
      title: 'Get in touch - BMX Calendar',
      description: 'Contact the BMX Calendar team for questions, feedback or partnerships.',
    },
  },
  {
    path: '/privacy-policy',
    component: PrivacyPolicyPage,
    meta: {
      title: 'Privacy Policy - BMX Calendar',
      description: 'How BMX Calendar handles your personal data, cookies and advertising.',
    },
  },
  {
    path: '/terms',
    component: TermsPage,
    meta: {
      title: 'Terms of Service - BMX Calendar',
      description: 'The terms and conditions for using BMX Calendar.',
    },
  },
];

// Routes that are utility/auth screens with no publisher content.
// AdSense must not serve ads on these pages.
const NO_AD_ROUTES = new Set([
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

// News article pages have no publisher content for ads
const NO_AD_ROUTE_PREFIXES = ['/news/'];

export function shouldSuppressAds(path: string): boolean {
  return (
    NO_AD_ROUTES.has(path) || NO_AD_ROUTE_PREFIXES.some((p) => path.startsWith(p))
  );
}

export function findRoute(path: string): RouteDefinition | undefined {
  return (
    routes.find((r) => r.prefix && path.startsWith(r.path.replace(/\/:.*$/, '/'))) ??
    routes.find((r) => r.path === path)
  );
}

export function isAccessGranted(
  access: AccessRule | undefined,
  user: { role?: string | null; managedTeams?: string[] | { id: string }[] } | null,
): boolean {
  if (!access || access === 'public') return true;
  if (!user) return false;
  switch (access) {
    case 'authenticated':
      return true;
    case 'admin':
      return user.role === 'admin';
    case 'teamManager':
      return user.role === 'admin' || (user.managedTeams?.length ?? 0) > 0;
  }
}
