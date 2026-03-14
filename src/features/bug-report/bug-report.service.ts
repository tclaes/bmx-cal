import { supabase } from '@data/supabase';

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

export const bugReportService = {
  async submitReport({ description, screenshotFile, reporterEmail, userId }: SubmitReportParams) {
    let screenshotUrl: string | null = null;

    if (screenshotFile) {
      try {
        screenshotUrl = await uploadScreenshot(screenshotFile);
      } catch {
        // non-fatal: submit without screenshot
        screenshotUrl = null;
      }
    }

    const { error } = await supabase.from('bug_reports').insert({
      description,
      screenshot_url: screenshotUrl,
      reporter_email: reporterEmail,
      user_id: userId,
    });

    if (error) throw new Error(error.message);
  },
};
