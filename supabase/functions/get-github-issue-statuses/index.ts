import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { getAuthHeader, isAdmin } from "../_shared/auth.ts";

interface IssueStatusResult {
  github_issue_url: string;
  github_state: "open" | "closed" | "unknown";
}

Deno.serve(async (req: Request) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  try {
    const githubToken = Deno.env.get("GITHUB_TOKEN");
    const githubRepo = Deno.env.get("GITHUB_REPO");

    if (!githubToken || !githubRepo) {
      return jsonResponse({ error: "GitHub integration not configured" }, 503);
    }

    // Same admin gate as create-github-issue / reopen-github-issue: the anon key
    // satisfies verify_jwt, so the caller has to be identified here.
    const authHeader = getAuthHeader(req);
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabaseClient.auth.getUser();
    if (!isAdmin(userData?.user)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { urls }: { urls: string[] } = await req.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return jsonResponse({ results: [] });
    }

    const results: IssueStatusResult[] = await Promise.all(
      urls.map(async (url): Promise<IssueStatusResult> => {
        const match = url.match(/\/issues\/(\d+)$/);
        if (!match) return { github_issue_url: url, github_state: "unknown" };

        const issueNumber = match[1];

        try {
          const response = await fetch(
            `https://api.github.com/repos/${githubRepo}/issues/${issueNumber}`,
            {
              headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
              },
            }
          );

          if (!response.ok) return { github_issue_url: url, github_state: "unknown" };

          const issue = await response.json();
          return {
            github_issue_url: url,
            github_state: issue.state === "closed" ? "closed" : "open",
          };
        } catch {
          return { github_issue_url: url, github_state: "unknown" };
        }
      })
    );

    return jsonResponse({ results });
  } catch (err) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
