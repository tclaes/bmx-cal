import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BugReportPayload {
  id: string;
  description: string;
  screenshot_url: string | null;
  reporter_email: string | null;
  created_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user || user.app_metadata?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const githubToken = Deno.env.get("GITHUB_TOKEN");
    const githubRepo = Deno.env.get("GITHUB_REPO");

    if (!githubToken || !githubRepo) {
      return new Response(
        JSON.stringify({ error: "GitHub integration not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: BugReportPayload = await req.json();

    if (!payload.id || !payload.description?.trim()) {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      return new Response(
        JSON.stringify({ error: `GitHub API error: ${response.status}`, detail: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const issue = await response.json();

    return new Response(
      JSON.stringify({ issue_url: issue.html_url, issue_number: issue.number }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
