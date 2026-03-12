import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// The organizer URLs to scrape
const ORGANIZER_URLS = [
  "https://registration.jstiming.com/organizers/98eff7e5-2cb8-49b0-acbd-ba70b036fb04",
  "https://registration.jstiming.com/organizers/98effea6-837b-4e34-b7d1-663581c2d955",
  "https://registration.jstiming.com/organizers/9a8a8697-ace7-4763-bbb7-b2f84597413c",
  "https://registration.jstiming.com/organizers/9d384820-0199-4d3c-a59e-4ef14ce1f3db",
  "https://registration.jstiming.com/organizers/9e418ce0-4b25-42eb-8cb0-1b91eafd5d92",
];

interface JsTimingCategory {
  name: string;
  price_eur: number | null;
  price_late_entry_eur: number | null;
  price_extra_late_entry_eur: number | null;
}

interface JsTimingEvent {
  name: string;
  url: string;
  event_date: string;
  organizer: string;
  country: string;
  city: string;
  registration_opens: string | null;
  registration_closes: string | null;
  late_entry_closes: string | null;
  extra_late_entry_closes: string | null;
  cancellation_closes: string | null;
  status: string;
  categories: JsTimingCategory[];
}

interface OrganizerData {
  organizer_url: string;
  organizer_name: string;
  scraped_at: string;
  events: JsTimingEvent[];
}

// Parse a date string like "29-01-2026" to "2026-01-29"
function parseDMYDate(dateStr: string): string | null {
  const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

// Parse a datetime string like "12-03-2026 23:59h CET" to an ISO date "2026-03-12"
function parseDateTimeToDate(dateTimeStr: string): string | null {
  const match = dateTimeStr.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

// Parse "Not possible" values to null
function parseNullable(value: string): string | null {
  if (!value || value.toLowerCase().includes("not possible")) return null;
  return value;
}

// Extract event links from an organizer page HTML
function extractEventLinks(html: string, baseUrl: string): Array<{ name: string; url: string }> {
  const events: Array<{ name: string; url: string }> = [];
  // Match anchor tags that point to /events/ paths
  const linkRegex = /<a[^>]+href="(\/events\/[a-f0-9-]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  const seen = new Set<string>();

  while ((match = linkRegex.exec(html)) !== null) {
    const path = match[1];
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    const url = `https://registration.jstiming.com${path}`;

    // Only include the main event link (not /registrations or /entries sub-pages)
    if (!path.includes("/registrations") && !path.includes("/entries") && !seen.has(url) && text) {
      seen.add(url);
      events.push({ name: text, url });
    }
  }
  return events;
}

// Extract organizer name from the page HTML
function extractOrganizerName(html: string): string {
  const titleMatch = html.match(/<title>(.*?)\s*-\s*Registration/i);
  if (titleMatch) return titleMatch[1].trim();
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) return h1Match[1].replace(/<[^>]+>/g, "").trim();
  return "Unknown Organizer";
}

// Scrape an individual event page and return structured data
async function scrapeEventPage(eventUrl: string, eventName: string): Promise<JsTimingEvent | null> {
  try {
    const res = await fetch(eventUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BMXCalBot/1.0)" },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Extract fields from the text content using regex patterns on the HTML
    const getText = (label: string): string | null => {
      // Look for label followed by its value in dt/dd pairs or similar structures
      const patterns = [
        new RegExp(`${label}[\\s\\S]{0,50}?<dd[^>]*>([\\s\\S]*?)<\\/dd>`, "i"),
        new RegExp(`${label}[\\s\\S]{0,20}?<\\/dt>[\\s\\n]*<dd[^>]*>([\\s\\S]*?)<\\/dd>`, "i"),
      ];
      for (const pattern of patterns) {
        const m = html.match(pattern);
        if (m) return m[1].replace(/<[^>]+>/g, "").trim();
      }
      return null;
    };

    // Extract all the key-value pairs from the details section
    // The page structure has dt (label) and dd (value) pairs
    const dtddRegex = /<dt[^>]*>([\s\S]*?)<\/dt>[\s\n]*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
    const fields: Record<string, string> = {};
    let m;
    while ((m = dtddRegex.exec(html)) !== null) {
      const key = m[1].replace(/<[^>]+>/g, "").trim().toLowerCase();
      const value = m[2].replace(/<[^>]+>/g, "").trim();
      fields[key] = value;
    }

    // Extract categories from table rows
    const categories: JsTimingCategory[] = [];
    const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let rowMatch;
    let isFirstRow = true;
    while ((rowMatch = tableRowRegex.exec(html)) !== null) {
      const rowContent = rowMatch[1];
      if (rowContent.includes("<th")) {
        isFirstRow = false;
        continue;
      }
      if (isFirstRow) continue;
      const cells: string[] = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, "").trim());
      }
      if (cells.length >= 2 && cells[0]) {
        const parsePrice = (s: string): number | null => {
          if (!s || s.toLowerCase().includes("not possible")) return null;
          const num = parseFloat(s.replace(/[^0-9.]/g, ""));
          return isNaN(num) ? null : num;
        };
        categories.push({
          name: cells[0],
          price_eur: parsePrice(cells[1] || ""),
          price_late_entry_eur: parsePrice(cells[2] || ""),
          price_extra_late_entry_eur: parsePrice(cells[3] || ""),
        });
      }
    }

    // Parse the dates
    const eventDateRaw = fields["event date"] || fields["date"] || "";
    const regOpensRaw = fields["registration opens at"] || fields["registration opens"] || "";
    const regClosesRaw = fields["registration closes on"] || fields["registration closes"] || "";
    const lateEntryRaw = fields["late entry closes on"] || "";
    const extraLateRaw = fields["extra late entry closes on"] || "";
    const cancellationRaw = fields["cancellation closes on"] || "";
    const city = fields["city"] || "";
    const country = fields["country"] || "";
    const organizer = fields["organizer"] || "";

    const eventDate = parseDMYDate(eventDateRaw) || eventDateRaw;
    const regOpens = regOpensRaw ? parseDMYDate(regOpensRaw) : null;
    const regCloses = regClosesRaw ? parseDateTimeToDate(regClosesRaw) : null;
    const lateEntry = parseNullable(lateEntryRaw) ? parseDateTimeToDate(lateEntryRaw) : null;
    const extraLate = parseNullable(extraLateRaw) ? parseDateTimeToDate(extraLateRaw) : null;
    const cancellation = cancellationRaw ? parseDateTimeToDate(cancellationRaw) : null;

    // Determine status based on registration window
    const today = new Date().toISOString().split("T")[0];
    let status = "upcoming";
    if (regOpens && regCloses) {
      if (today >= regOpens && today <= regCloses) status = "open";
      else if (today > regCloses) status = "closed";
    }

    return {
      name: eventName,
      url: eventUrl,
      event_date: eventDate,
      organizer,
      country,
      city,
      registration_opens: regOpens,
      registration_closes: regCloses,
      late_entry_closes: lateEntry,
      extra_late_entry_closes: extraLate,
      cancellation_closes: cancellation,
      status,
      categories,
    };
  } catch (err) {
    console.error(`Failed to scrape event ${eventUrl}:`, err);
    return null;
  }
}

// Scrape one organizer URL and return all its events
async function scrapeOrganizer(organizerUrl: string): Promise<OrganizerData> {
  const res = await fetch(organizerUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BMXCalBot/1.0)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch organizer page: ${res.status}`);
  const html = await res.text();

  const organizerName = extractOrganizerName(html);
  const eventLinks = extractEventLinks(html, organizerUrl);

  console.log(`Found ${eventLinks.length} events for organizer: ${organizerName}`);

  // Scrape each event page (sequentially to be polite to the server)
  const events: JsTimingEvent[] = [];
  for (const link of eventLinks) {
    const event = await scrapeEventPage(link.url, link.name);
    if (event) events.push(event);
  }

  return {
    organizer_url: organizerUrl,
    organizer_name: organizerName,
    scraped_at: new Date().toISOString(),
    events,
  };
}

// Upsert events into the Supabase database, updating registration dates if changed
async function syncEventsToDatabase(
  supabase: ReturnType<typeof createClient>,
  organizerData: OrganizerData
): Promise<{ updated: number; inserted: number; unchanged: number; errors: string[] }> {
  const stats = { updated: 0, inserted: 0, unchanged: 0, errors: [] as string[] };

  for (const jsEvent of organizerData.events) {
    try {
      // Try to find existing event by registration URL (most reliable match)
      const { data: existing } = await supabase
        .from("events")
        .select("id, title, registration_opens, registration_deadline, registration_status, date")
        .eq("registration_url", jsEvent.url)
        .maybeSingle();

      const newOpens = jsEvent.registration_opens;
      const newDeadline = jsEvent.registration_closes;
      const newStatus = jsEvent.status;

      if (existing) {
        // Check if any registration dates have changed
        const hasChanges =
          existing.registration_opens !== newOpens ||
          existing.registration_deadline !== newDeadline ||
          existing.registration_status !== newStatus;

        if (hasChanges) {
          const { error } = await supabase
            .from("events")
            .update({
              registration_opens: newOpens,
              registration_deadline: newDeadline,
              registration_status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (error) {
            stats.errors.push(`Update failed for ${jsEvent.name}: ${error.message}`);
          } else {
            stats.updated++;
            console.log(`Updated: ${jsEvent.name} (opens: ${newOpens}, deadline: ${newDeadline})`);
          }
        } else {
          stats.unchanged++;
        }
      } else {
        // Try to find by title + date as a fallback
        const { data: byTitle } = await supabase
          .from("events")
          .select("id, title, registration_opens, registration_deadline, registration_status")
          .ilike("title", `%${jsEvent.name.trim()}%`)
          .eq("date", jsEvent.event_date)
          .maybeSingle();

        if (byTitle) {
          const hasChanges =
            byTitle.registration_opens !== newOpens ||
            byTitle.registration_deadline !== newDeadline ||
            byTitle.registration_status !== newStatus;

          if (hasChanges) {
            const { error } = await supabase
              .from("events")
              .update({
                registration_url: jsEvent.url,
                registration_opens: newOpens,
                registration_deadline: newDeadline,
                registration_status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", byTitle.id);

            if (error) {
              stats.errors.push(`Update failed for ${jsEvent.name}: ${error.message}`);
            } else {
              stats.updated++;
              console.log(`Updated (by title match): ${jsEvent.name}`);
            }
          } else {
            stats.unchanged++;
          }
        } else {
          // No existing event found — log it but don't auto-insert (avoid duplicates)
          console.log(`No existing event found for: ${jsEvent.name} on ${jsEvent.event_date}`);
          stats.inserted++; // count as "would insert" for reporting
        }
      }
    } catch (err) {
      stats.errors.push(`Error processing ${jsEvent.name}: ${String(err)}`);
    }
  }

  return stats;
}

// Store the scraped JSON snapshot in the sync_logs table (or just log it)
async function storeSyncLog(
  supabase: ReturnType<typeof createClient>,
  organizerData: OrganizerData,
  syncStats: { updated: number; inserted: number; unchanged: number; errors: string[] }
) {
  try {
    await supabase.from("sync_logs").insert({
      organizer_url: organizerData.organizer_url,
      organizer_name: organizerData.organizer_name,
      scraped_at: organizerData.scraped_at,
      events_found: organizerData.events.length,
      events_updated: syncStats.updated,
      events_unchanged: syncStats.unchanged,
      errors: syncStats.errors,
      snapshot: organizerData,
    });
  } catch {
    // sync_logs table may not exist yet — fail silently
    console.log("Could not write to sync_logs (table may not exist yet)");
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: Array<{
      organizer: string;
      url: string;
      events_found: number;
      updated: number;
      inserted: number;
      unchanged: number;
      errors: string[];
    }> = [];

    for (const organizerUrl of ORGANIZER_URLS) {
      console.log(`\nScraping: ${organizerUrl}`);
      try {
        const organizerData = await scrapeOrganizer(organizerUrl);
        const syncStats = await syncEventsToDatabase(supabase, organizerData);
        await storeSyncLog(supabase, organizerData, syncStats);

        results.push({
          organizer: organizerData.organizer_name,
          url: organizerUrl,
          events_found: organizerData.events.length,
          ...syncStats,
        });
      } catch (err) {
        console.error(`Failed to process ${organizerUrl}:`, err);
        results.push({
          organizer: "Unknown",
          url: organizerUrl,
          events_found: 0,
          updated: 0,
          inserted: 0,
          unchanged: 0,
          errors: [String(err)],
        });
      }
    }

    const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
    const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);

    return new Response(
      JSON.stringify({
        success: true,
        ran_at: new Date().toISOString(),
        summary: { total_updated: totalUpdated, total_errors: totalErrors },
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
