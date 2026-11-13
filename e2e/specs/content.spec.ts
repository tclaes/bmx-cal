import { test, expect } from '../fixtures/test';
import { PUBLIC_PAGES } from '../fixtures/pages';
import type { NewsArticle } from '../../src/types';

const article = (overrides: Partial<NewsArticle>): NewsArticle => ({
  id: 'news-1',
  title: 'Season opener announced',
  slug: 'season-opener',
  excerpt: 'The first race of the season is set.',
  content: '# Season opener\n\nThe **first race** is in Genk.\n\n- Registration opens soon',
  author: 'BMX Calendar',
  published: true,
  published_at: '2025-03-01T10:00:00Z',
  created_at: '2025-03-01T10:00:00Z',
  updated_at: '2025-03-01T10:00:00Z',
  ...overrides,
});

test.describe('public pages', () => {
  for (const { path, heading } of PUBLIC_PAGES) {
    test(`${path} renders its heading`, async ({ page, backend }) => {
      await backend();
      await page.goto(path);

      await expect(page.getByRole('heading', { level: 1, name: heading }).first()).toBeVisible();
    });
  }

  test('legacy /privacy redirects to /privacy-policy', async ({ page, backend }) => {
    await backend();
    await page.goto('/privacy');

    await expect(page).toHaveURL(/\/privacy-policy$/);
  });
});

test.describe('news', () => {
  const first = article({});
  const second = article({
    id: 'news-2',
    title: 'New calendar export',
    slug: 'calendar-export',
    excerpt: null,
    content: 'You can now export to iCal.',
    published_at: '2025-04-01T10:00:00Z',
  });

  test('lists published articles', async ({ page, backend }) => {
    await backend({ tables: { news: [first, second] } });
    await page.goto('/news');

    await expect(page.getByRole('link', { name: 'Season opener announced' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'New calendar export' })).toBeVisible();
    await expect(page.getByText('The first race of the season is set.')).toBeVisible();
  });

  test('shows an empty state without articles', async ({ page, backend }) => {
    await backend();
    await page.goto('/news');

    await expect(page.getByText('No news articles yet. Check back soon!')).toBeVisible();
  });

  test('opens an article and renders its content', async ({ page, backend }) => {
    await backend({ tables: { news: [first, second] } });
    await page.goto('/news');

    await page.getByRole('link', { name: 'Season opener announced' }).click();

    await expect(page).toHaveURL(/\/news\/season-opener$/);
    await expect(page.getByRole('heading', { name: 'Season opener', exact: true })).toBeVisible();
    await expect(page.getByText('first race', { exact: true })).toBeVisible();
    await expect(page.getByText('Registration opens soon')).toBeVisible();
  });

  test('an unknown article shows a not-found message', async ({ page, backend }) => {
    await backend({ tables: { news: [first] } });
    await page.goto('/news/does-not-exist');

    await expect(page.getByText('Article not found.')).toBeVisible();
  });
});
