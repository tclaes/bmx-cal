import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

/**
 * Validates that the provided origin is in the allowlist.
 * Prevents password-reset token exfiltration to attacker-controlled domains.
 */
function validateOrigin(requestedOrigin: string | null, allowedOrigins: string[]): string | null {
  if (!requestedOrigin) {
    return null;
  }

  try {
    const url = new URL(requestedOrigin);
    const normalizedOrigin = url.origin; // Ensures proper format (protocol + host + port)

    // Check if the normalized origin is in the allowlist
    if (allowedOrigins.includes(normalizedOrigin)) {
      return normalizedOrigin;
    }

    return null;
  } catch {
    // Invalid URL format
    return null;
  }
}

/**
 * HTML-escapes a string to prevent injection attacks in email templates.
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const allowedOriginsEnv = Deno.env.get("ALLOWED_ORIGINS");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse allowed origins from environment variable (comma-separated list)
    // Falls back to supabaseUrl if not configured
    const allowedOrigins = allowedOriginsEnv
      ? allowedOriginsEnv.split(",").map(o => o.trim()).filter(o => o.length > 0)
      : [supabaseUrl];

    const { email, appUrl } = await req.json();

    if (!email?.trim()) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the requested origin against the allowlist
    const requestedOrigin = appUrl || req.headers.get("origin");
    const validatedOrigin = validateOrigin(requestedOrigin, allowedOrigins);

    if (!validatedOrigin) {
      console.warn(`Rejected password reset request with invalid origin: ${requestedOrigin}`);
      return new Response(
        JSON.stringify({ error: "Invalid origin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email.trim(),
    });

    if (linkError) {
      if (
        linkError.message?.toLowerCase().includes("not found") ||
        linkError.message?.toLowerCase().includes("user not found")
      ) {
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw linkError;
    }

    const tokenHash = linkData.properties?.hashed_token;

    if (!tokenHash) {
      throw new Error("Failed to generate reset token");
    }

    const resetUrl = `${validatedOrigin}/reset-password?token_hash=${tokenHash}&type=recovery`;
    const escapedResetUrl = escapeHtml(resetUrl);

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Reset your password</h2>
        <p style="color: #555;">You requested a password reset for your BMX Calendar account.</p>
        <p style="color: #555;">Click the button below to set a new password. This link is valid for 1 hour.</p>
        <a href="${escapedResetUrl}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          Reset password
        </a>
        <p style="color:#999;font-size:0.85rem;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BMX Calendar <bmxcalendar@tcla.be>",
        to: [email.trim()],
        subject: "Reset your BMX Calendar password",
        html: htmlBody,
        text: `Reset your BMX Calendar password\n\nClick the link below to reset your password (valid for 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error("Resend error:", errorData);
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
