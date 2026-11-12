import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { getAuthHeader, isAdmin } from "../_shared/auth.ts";

interface BugReportPayload {
  id: string;
  description: string;
  screenshot_url: string | null;
  reporter_email: string | null;
  created_at: string;
}

Deno.serve(async (req: Request) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  try {
    const authHeader = getAuthHeader(req);
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user || !isAdmin(user)) {
      return jsonResponse({ error: "Unauthorized" }, 403);
    }

    const githubToken = Deno.env.get("GITHUB_TOKEN");
    const githubRepo = Deno.env.get("GITHUB_REPO");

    if (!githubToken || !githubRepo) {
      return jsonResponse({ error: "GitHub integration not configured" }, 503);
    }

    const payload: BugReportPayload = await req.json();

    if (!payload.id || !payload.description?.trim()) {
      return jsonResponse({ error: "Invalid payload" }, 400);
    }

    const body = [
      `## Bug Report`,
      ``,
      `**Description:**`,
      payload.description,
      ``,
      payload.reporter_email ? `**Reported by:** ${payload.reporter_email}` : `**Reported by:** Anonymous`,
      `**Report ID:** \`${payload.id}\``,
      `**Submitted at:** ${new Date(payload.created_at).toUTCString()}`,
      payload.screenshot_url && isValidUrl(payload.screenshot_url)
        ? `\n**Screenshot:**\n![Screenshot](${payload.screenshot_url})`
        : "",
    ]
      .filter((line) => line !== undefined)
      .join("\n");

    const title = payload.description.length > 80
      ? payload.description.slice(0, 77) + "..."
      : payload.description;

    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          title: `[Bug] ${title}`,
          body,
          labels: ["bug"],
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return jsonResponse({ error: `GitHub API error: ${response.status}`, detail: text }, 502);
    }

    const issue = await response.json();

    return jsonResponse({ issue_url: issue.html_url, issue_number: issue.number });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
