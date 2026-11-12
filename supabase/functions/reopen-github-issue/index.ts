import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { getAuthHeader, isAdmin } from "../_shared/auth.ts";

interface UpdatePayload {
  github_issue_url: string;
  state: "open" | "closed";
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

    const payload: UpdatePayload = await req.json();

    const match = payload.github_issue_url.match(/\/issues\/(\d+)$/);
    if (!match) {
      return jsonResponse({ error: "Invalid GitHub issue URL" }, 400);
    }

    const issueNumber = match[1];
    const state = payload.state === "closed" ? "closed" : "open";

    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/issues/${issueNumber}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ state }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return jsonResponse({ error: `GitHub API error: ${response.status}`, detail: text }, 502);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
