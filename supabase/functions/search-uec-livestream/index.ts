import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getUecCyclismeChannelId(apiKey: string): Promise<string | null> {
  try {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", "Uec Cyclisme");
    searchUrl.searchParams.set("type", "channel");
    searchUrl.searchParams.set("maxResults", "1");
    searchUrl.searchParams.set("key", apiKey);

    const response = await fetch(searchUrl.toString());
    if (!response.ok) return null;

    const data = await response.json();
    const items = data.items ?? [];

    if (items.length > 0 && items[0].id?.channelId) {
      return items[0].id.channelId;
    }

    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!youtubeApiKey) {
      return new Response(
        JSON.stringify({ error: "YOUTUBE_API_KEY secret is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const testEventId: string | undefined = body.event_id;

    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("events")
      .select("id, title, date");

    if (testEventId) {
      query = query.eq("id", testEventId);
    } else {
      query = query
        .gte("date", today)
        .lte("date", today)
        .or("title.ilike.%UEC%,title.ilike.%European Cup%,title.ilike.%European Championships%");
    }

    const { data: events, error: eventsError } = await query;

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ message: "No UEC events today", updated: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const channelId = await getUecCyclismeChannelId(youtubeApiKey);

    const results: { eventId: string; title: string; livestreamUrl: string | null; status: string }[] = [];

    for (const event of events) {
      const eventDate = new Date(event.date);
      const dayBefore = new Date(eventDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const dayAfter = new Date(eventDate);
      dayAfter.setDate(dayAfter.getDate() + 1);

      let bestMatch: string | null = null;
      let searchAttempts = [];

      const searchTerms = [
        `${event.title} ${eventDate.getFullYear()}`,
        `UEC BMX European Cup ${eventDate.getFullYear()}`,
        `BMX European Cup Round`
      ];

      for (const searchTerm of searchTerms) {
        const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
        searchUrl.searchParams.set("part", "snippet");
        searchUrl.searchParams.set("q", searchTerm);
        searchUrl.searchParams.set("type", "video");
        if (channelId) {
          searchUrl.searchParams.set("channelId", channelId);
        }
        searchUrl.searchParams.set("publishedAfter", dayBefore.toISOString());
        searchUrl.searchParams.set("publishedBefore", dayAfter.toISOString());
        searchUrl.searchParams.set("maxResults", "10");
        searchUrl.searchParams.set("order", "date");
        searchUrl.searchParams.set("key", youtubeApiKey);

        const searchResp = await fetch(searchUrl.toString());
        if (!searchResp.ok) {
          searchAttempts.push(`${searchTerm}: API error`);
          continue;
        }

        const searchData = await searchResp.json();
        const items = searchData.items ?? [];
        searchAttempts.push(`${searchTerm}: ${items.length} results`);

        for (const item of items) {
          const videoTitle: string = (item.snippet?.title ?? "").toLowerCase();
          const eventTitleLower = event.title.toLowerCase();

          const keywords = eventTitleLower
            .split(/[\s\-]+/)
            .filter((w: string) => w.length >= 3 && !['european', 'round'].includes(w));

          const matchCount = keywords.filter((kw: string) => videoTitle.includes(kw)).length;

          if (matchCount >= 2 || videoTitle.includes('bmx') && videoTitle.includes('european')) {
            bestMatch = `https://www.youtube.com/watch?v=${item.id.videoId}`;
            break;
          }
        }

        if (bestMatch) break;

        if (!bestMatch && items.length > 0) {
          const firstItem = items[0];
          const firstTitle = (firstItem.snippet?.title ?? "").toLowerCase();
          if (firstTitle.includes('bmx') || firstTitle.includes('uec')) {
            bestMatch = `https://www.youtube.com/watch?v=${firstItem.id.videoId}`;
            break;
          }
        }
      }

      if (bestMatch) {
        const { error: updateError } = await supabase
          .from("events")
          .update({ livestream_url: bestMatch })
          .eq("id", event.id);

        if (updateError) {
          results.push({
            eventId: event.id,
            title: event.title,
            livestreamUrl: null,
            status: `DB update error: ${updateError.message}`
          });
        } else {
          results.push({
            eventId: event.id,
            title: event.title,
            livestreamUrl: bestMatch,
            status: "updated"
          });
        }
      } else {
        results.push({
          eventId: event.id,
          title: event.title,
          livestreamUrl: null,
          status: `no match found. Attempts: ${searchAttempts.join('; ')}`
        });
      }
    }

    const updated = results.filter(r => r.status === "updated").length;

    return new Response(
      JSON.stringify({ message: `Processed ${events.length} UEC event(s)`, updated, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
