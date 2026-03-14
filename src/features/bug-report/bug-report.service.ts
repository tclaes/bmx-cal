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

async function createGithubIssue(report: BugReport): Promise<string | null> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-github-issue`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
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
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    await fetch(`${supabaseUrl}/functions/v1/reopen-github-issue`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ github_issue_url: githubIssueUrl, state }),
    });
  } catch {
    // non-fatal
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
