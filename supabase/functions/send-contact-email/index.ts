import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";

interface ContactPayload {
  name: string;
  email: string;
  clubName?: string;
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_NAME = 120;
const MAX_CLUB = 120;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;

// Best-effort per-IP throttle so the form cannot be used as a mail flooder.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const recentSubmissions = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recentSubmissions.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (hits.length >= RATE_LIMIT_MAX) {
    recentSubmissions.set(ip, hits);
    return true;
  }

  hits.push(now);
  recentSubmissions.set(ip, hits);

  if (recentSubmissions.size > 5000) recentSubmissions.clear();

  return false;
}

Deno.serve(async (req: Request) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return jsonResponse({ error: "Email service not configured" }, 503);
    }

    const body: ContactPayload = await req.json();
    const { name, email, clubName, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    if (
      name.trim().length > MAX_NAME ||
      email.trim().length > MAX_EMAIL ||
      (clubName ?? "").trim().length > MAX_CLUB ||
      message.trim().length > MAX_MESSAGE ||
      !EMAIL_PATTERN.test(email.trim())
    ) {
      return jsonResponse({ error: "Invalid input" }, 400);
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    if (isRateLimited(clientIp)) {
      return jsonResponse({ error: "Too many messages. Please try again later." }, 429);
    }

    const htmlBody = `
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      ${clubName ? `<p><strong>Club / Team:</strong> ${escapeHtml(clubName)}</p>` : ""}
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <hr />
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    `;

    const textBody = [
      `Name: ${name}`,
      clubName ? `Club / Team: ${clubName}` : null,
      `Email: ${email}`,
      "",
      message,
    ].filter(Boolean).join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BMX Calendar <bmxcalendar@tcla.be>",
        to: ["tom.claes82@gmail.com"],
        reply_to: email,
        subject: `Team features inquiry from ${clubName || name}`,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend error:", errorData);
      return jsonResponse({ error: "Failed to send email" }, 500);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("Unexpected error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
