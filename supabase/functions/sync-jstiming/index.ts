import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ORGANIZER_URLS = [
  "https://registration.jstiming.com/organizers/98eff7e5-2cb8-49b0-acbd-ba70b036fb04",
  "https://registration.jstiming.com/organizers/98effea6-837b-4e34-b7d1-663581c2d955",
  "https://registration.jstiming.com/organizers/9a8a8697-ace7-4763-bbb7-b2f84597413c",
  "https://registration.jstiming.com/organizers/9d384820-0199-4d3c-a59e-4ef14ce1f3db",
  "https://registration.jstiming.com/organizers/9e418ce0-4b25-42eb-8cb0-1b91eafd5d92",
];

interface RawJsTimingEvent {
  uuid: string;
  name: string;
  country: string;
  city: string;
  event_date: string;
  event_date_to: string | null;
  registration_open_date: string | null;
  registration_close_date: string | null;
  registration_late_entry_close_date: string | null;
  registration_extra_late_entry_close_date: string | null;
  registration_cancel_close_date: string | null;
  registration_open: boolean;
  organizer: { uuid: string; name: string };
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
}

interface OrganizerData {
  organizer_url: string;
  organizer_name: string;
  scraped_at: string;
  events: JsTimingEvent[];
}

function parseDMYDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function determineStatus(regOpens: string | null, regCloses: string | null, registrationOpen: boolean): string {
  if (registrationOpen) return "open";
  const today = new Date().toISOString().split("T")[0];
  if (regCloses && today > regCloses) return "closed";
  return "upcoming";
}

function extractPayload(html: string): { organizer_name: string; events: JsTimingEvent[] } | null {
  const match = html.match(/data-payload="([^"]+)"/);
  if (!match) return null;

  const decoded = match[1]
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  let payload: { view: { properties: { organizer: { name: string }; events: Record<string, RawJsTimingEvent[]> } } };
  try {
    payload = JSON.parse(decoded);
  } catch {
    return null;
  }

  const props = payload?.view?.properties;
  if (!props) return null;

  const organizerName = props.organizer?.name ?? "Unknown Organizer";
  const allEvents: JsTimingEvent[] = [];

  for (const [_status, eventList] of Object.entries(props.events ?? {})) {
    for (const ev of eventList) {
      const regOpens = parseDMYDate(ev.registration_open_date ?? null);
      const regCloses = parseDMYDate(ev.registration_close_date ?? null);
      const lateEntry = parseDMYDate(ev.registration_late_entry_close_date ?? null);
      const extraLate = parseDMYDate(ev.registration_extra_late_entry_close_date ?? null);
      const cancellation = parseDMYDate(ev.registration_cancel_close_date ?? null);
      const eventDate = parseDMYDate(ev.event_date) ?? ev.event_date;

      allEvents.push({
        name: ev.name,
        url: `https://registration.jstiming.com/events/${ev.uuid}`,
        event_date: eventDate,
        organizer: ev.organizer?.name ?? organizerName,
        country: ev.country ?? "",
        city: ev.city ?? "",
        registration_opens: regOpens,
        registration_closes: regCloses,
        late_entry_closes: lateEntry,
        extra_late_entry_closes: extraLate,
        cancellation_closes: cancellation,
        status: determineStatus(regOpens, regCloses, ev.registration_open),
      });
    }
  }

  return { organizer_name: organizerName, events: allEvents };
}

async function scrapeOrganizer(organizerUrl: string): Promise<OrganizerData> {
  const res = await fetch(organizerUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BMXCalBot/1.0)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch organizer page: ${res.status}`);
  const html = await res.text();

  const result = extractPayload(html);
  if (!result) throw new Error("Could not extract data-payload from page");

  console.log(`Found ${result.events.length} events for organizer: ${result.organizer_name}`);

  return {
    organizer_url: organizerUrl,
    organizer_name: result.organizer_name,
    scraped_at: new Date().toISOString(),
    events: result.events,
  };
}

async function syncEventsToDatabase(
  supabase: ReturnType<typeof createClient>,
  organizerData: OrganizerData
): Promise<{ updated: number; inserted: number; unchanged: number; errors: string[] }> {
  const stats = { updated: 0, inserted: 0, unchanged: 0, errors: [] as string[] };

  for (const jsEvent of organizerData.events) {
    try {
      const { data: existing } = await supabase
        .from("events")
        .select("id, title, registration_opens, registration_deadline, registration_status")
        .eq("registration_url", jsEvent.url)
        .maybeSingle();

      const newOpens = jsEvent.registration_opens;
      const newDeadline = jsEvent.registration_closes;
      const newStatus = jsEvent.status;

      if (existing) {
        const hasChanges =
          existing.registration_opens !== newOpens ||
          existing.registration_deadline !== newDeadline ||
          existing.registration_status !== newStatus ||
          existing.title !== jsEvent.name;

        if (hasChanges) {
          const { error } = await supabase
            .from("events")
            .update({
              title: jsEvent.name,
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
            console.log(`Updated: ${jsEvent.name}`);
          }
        } else {
          stats.unchanged++;
        }
      } else {
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
            byTitle.registration_status !== newStatus ||
            byTitle.title !== jsEvent.name;

          if (hasChanges) {
            const { error } = await supabase
              .from("events")
              .update({
                title: jsEvent.name,
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
          console.log(`No existing event found for: ${jsEvent.name} on ${jsEvent.event_date}`);
          stats.inserted++;
        }
      }
    } catch (err) {
      stats.errors.push(`Error processing ${jsEvent.name}: ${String(err)}`);
    }
  }

  return stats;
}

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
