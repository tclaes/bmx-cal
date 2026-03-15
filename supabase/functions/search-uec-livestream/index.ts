import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const results: { eventId: string; title: string; livestreamUrl: string | null; status: string }[] = [];

    for (const event of events) {
      const searchQuery = `${event.title} ${new Date(event.date).getFullYear()} live`;

      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.set("part", "snippet");
      searchUrl.searchParams.set("q", searchQuery);
      searchUrl.searchParams.set("type", "video");
      searchUrl.searchParams.set("eventType", "live");
      searchUrl.searchParams.set("maxResults", "5");
      searchUrl.searchParams.set("key", youtubeApiKey);

      const searchResp = await fetch(searchUrl.toString());
      if (!searchResp.ok) {
        const errText = await searchResp.text();
        results.push({ eventId: event.id, title: event.title, livestreamUrl: null, status: `YouTube API error: ${errText}` });
        continue;
      }

      const searchData = await searchResp.json();
      const items = searchData.items ?? [];

      let bestMatch: string | null = null;

      for (const item of items) {
        const videoTitle: string = (item.snippet?.title ?? "").toLowerCase();
        const titleLower = event.title.toLowerCase();
        const keywords = titleLower.split(" ").filter((w: string) => w.length > 3);
        const matchCount = keywords.filter((kw: string) => videoTitle.includes(kw)).length;

        if (matchCount >= 2) {
          bestMatch = `https://www.youtube.com/watch?v=${item.id.videoId}`;
          break;
        }
      }

      if (!bestMatch && items.length > 0) {
        bestMatch = `https://www.youtube.com/watch?v=${items[0].id.videoId}`;
      }

      if (bestMatch) {
        const { error: updateError } = await supabase
          .from("events")
          .update({ livestream_url: bestMatch })
          .eq("id", event.id);

        if (updateError) {
          results.push({ eventId: event.id, title: event.title, livestreamUrl: null, status: `DB update error: ${updateError.message}` });
        } else {
          results.push({ eventId: event.id, title: event.title, livestreamUrl: bestMatch, status: "updated" });
        }
      } else {
        results.push({ eventId: event.id, title: event.title, livestreamUrl: null, status: "no live stream found" });
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
