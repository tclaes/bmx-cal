import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import type { BugReport } from '@features/bug-report/bug-report.service';

const report = (id: string, status: string): BugReport => ({
  id,
  description: `Report ${id}`,
  screenshot_url: null,
  reporter_email: null,
  user_id: null,
  status,
  github_issue_url: null,
  created_at: '2026-11-01T10:00:00Z',
});

const reports = vi.hoisted(() => ({ list: [] as BugReport[] }));

vi.mock('@features/bug-report/bug-report.service', async (orig) => {
  const actual = await orig<typeof import('@features/bug-report/bug-report.service')>();
  return {
    ...actual,
    adminBugReportService: {
      getAllReports: vi.fn(async () => reports.list),
      syncGithubStatuses: vi.fn(async (list: BugReport[]) => list),
      updateStatus: vi.fn(async () => {}),
    },
  };
});

import BugReportsPanel from '../features/admin/BugReportsPanel.svelte';

describe('BugReportsPanel', () => {
  it('shows each status as text in its badge, falling back to the raw value', async () => {
    reports.list = [report('1', 'open'), report('2', 'in_progress'), report('3', 'resolved'), report('4', 'duplicate')];
    render(BugReportsPanel);

    await screen.findByText('Report 4');
    const badges = Array.from(document.querySelectorAll('.badge')).map((b) => b.textContent?.trim());
    expect(badges).toEqual(['Open', 'In Progress', 'Resolved', 'duplicate']);
  });
});
