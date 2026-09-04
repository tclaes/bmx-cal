import { supabase } from '@data/supabase';

export interface BugReport {
  id: string;
  description: string;
  screenshot_url: string | null;
  reporter_email: string | null;
  user_id: string | null;
  status: string;
  github_issue_url: string | null;
  created_at: string;
}

interface SubmitReportParams {
  description: string;
  screenshotFile: File | null;
  reporterEmail: string | null;
  userId: string | null;
}

async function uploadScreenshot(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `bug-reports/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('bug-report-screenshots')
    .upload(path, file, { contentType: file.type });

  if (error) throw new Error(`Screenshot upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from('bug-report-screenshots')
    .getPublicUrl(path);

  return data.publicUrl;
}

async function authHeaders(): Promise<Record<string, string> | null> {
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) return null;

  return {
    Authorization: `Bearer ${accessToken}`,
    apikey: supabaseAnonKey,
    'Content-Type': 'application/json',
  };
}

async function createGithubIssue(report: BugReport): Promise<string | null> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const headers = await authHeaders();

    if (!headers) return null;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-github-issue`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(report),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.issue_url ?? null;
  } catch {
    return null;
  }
}

export const bugReportService = {
  async submitReport({ description, screenshotFile, reporterEmail, userId }: SubmitReportParams) {
    let screenshotUrl: string | null = null;

    if (screenshotFile) {
      try {
        screenshotUrl = await uploadScreenshot(screenshotFile);
      } catch {
        screenshotUrl = null;
      }
    }

    const { data: report, error } = await supabase
      .from('bug_reports')
      .insert({
        description,
        screenshot_url: screenshotUrl,
        reporter_email: reporterEmail,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const issueUrl = await createGithubIssue(report as BugReport);

    if (issueUrl) {
      await supabase
        .from('bug_reports')
        .update({ github_issue_url: issueUrl })
        .eq('id', report.id);
    }
  },
};

async function updateGithubIssueState(githubIssueUrl: string, state: 'open' | 'closed'): Promise<void> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const headers = await authHeaders();

    if (!headers) return;

    await fetch(`${supabaseUrl}/functions/v1/reopen-github-issue`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ github_issue_url: githubIssueUrl, state }),
    });
  } catch {
    // non-fatal
  }
}

async function fetchGithubIssueStatuses(
  urls: string[]
): Promise<Record<string, 'open' | 'closed' | 'unknown'>> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const headers = await authHeaders();

    if (!headers) return {};

    const response = await fetch(`${supabaseUrl}/functions/v1/get-github-issue-statuses`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) return {};

    const data = await response.json();
    const map: Record<string, 'open' | 'closed' | 'unknown'> = {};
    for (const r of data.results ?? []) {
      map[r.github_issue_url] = r.github_state;
    }
    return map;
  } catch {
    return {};
  }
}

export const adminBugReportService = {
  async getAllReports(): Promise<BugReport[]> {
    const { data, error } = await supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as BugReport[];
  },

  async syncGithubStatuses(reports: BugReport[]): Promise<BugReport[]> {
    const withIssue = reports.filter(r => r.github_issue_url);
    if (withIssue.length === 0) return reports;

    const urls = withIssue.map(r => r.github_issue_url as string);
    const stateMap = await fetchGithubIssueStatuses(urls);

    const updates: Promise<void>[] = [];
    const updatedReports = reports.map(report => {
      if (!report.github_issue_url) return report;

      const githubState = stateMap[report.github_issue_url];
      if (githubState === 'unknown' || githubState === undefined) return report;

      const shouldBeResolved = githubState === 'closed' && report.status !== 'resolved';
      const shouldBeOpen = githubState === 'open' && report.status === 'resolved';

      if (shouldBeResolved) {
        updates.push(
          supabase.from('bug_reports').update({ status: 'resolved' }).eq('id', report.id).then(() => {})
        );
        return { ...report, status: 'resolved' };
      }

      if (shouldBeOpen) {
        updates.push(
          supabase.from('bug_reports').update({ status: 'open' }).eq('id', report.id).then(() => {})
        );
        return { ...report, status: 'open' };
      }

      return report;
    });

    await Promise.all(updates);
    return updatedReports;
  },

  async updateStatus(id: string, status: string, report?: BugReport): Promise<void> {
    const { error } = await supabase
      .from('bug_reports')
      .update({ status })
      .eq('id', id);

    if (error) throw new Error(error.message);

    if (report?.github_issue_url) {
      if (status === 'open') {
        await updateGithubIssueState(report.github_issue_url, 'open');
      } else if (status === 'resolved') {
        await updateGithubIssueState(report.github_issue_url, 'closed');
      }
    }
  },
};
