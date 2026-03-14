import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface IssueStatusResult {
  github_issue_url: string;
  github_state: "open" | "closed" | "unknown";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const githubToken = Deno.env.get("GITHUB_TOKEN");
    const githubRepo = Deno.env.get("GITHUB_REPO");

    if (!githubToken || !githubRepo) {
      return new Response(
        JSON.stringify({ error: "GitHub integration not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { urls }: { urls: string[] } = await req.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ results: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
