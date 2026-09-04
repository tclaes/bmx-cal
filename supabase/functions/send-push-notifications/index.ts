import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface EventRow {
  id: string;
  title: string;
  registration_deadline: string | null;
  registration_url: string | null;
  event_type: { name: string } | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Supabase not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vapidPrivateKey || !vapidPublicKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const isTest = body.test === true;

    const { createClient } = await import("npm:@supabase/supabase-js@2");

    const authHeader = req.headers.get("Authorization") ?? "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    // The scheduled broadcast is invoked by pg_cron with the service-role key.
    const isScheduledRun = bearer.length > 0 && bearer === serviceRoleKey;

    let callerUserId: string | null = null;
    let callerIsAdmin = false;

    if (!isScheduledRun) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      const user = userData?.user ?? null;

      if (!user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      callerUserId = user.id;
      callerIsAdmin = user.app_metadata?.role === "admin";

      // Only the scheduler or an admin may broadcast to everyone.
      if (!isTest && !callerIsAdmin) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let subscriptionQuery = supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth");

    // A test notification only ever goes to the device(s) of the caller.
    if (isTest && callerUserId) {
      subscriptionQuery = subscriptionQuery.eq("user_id", callerUserId);
    }

    const { data: subscriptions, error: subError } = await subscriptionQuery;

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No subscriptions" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webPushKey = await import("npm:web-push@3.6.7");
    webPushKey.setVapidDetails(
      `mailto:bmxcalendar@tcla.be`,
      vapidPublicKey,
      vapidPrivateKey
    );

    let sentCount = 0;
    let failedCount = 0;

    if (isTest) {
      for (const sub of subscriptions as PushSubscriptionRow[]) {
        const payload = JSON.stringify({
          title: "BMX Kalender - Test Notificatie",
          body: "Push notificaties werken! Je ontvangt nu herinneringen voor inschrijvingsdeadlines.",
          url: "/",
          tag: "test-notification",
        });

        try {
          await webPushKey.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          }, payload);
          sentCount++;
        } catch (err) {
          console.error(`Push failed for subscription ${sub.id}:`, err);
          failedCount++;

          if (err instanceof Error && err.message.includes("410")) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          sent: sentCount,
          failed: failedCount,
          test: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const daysBefore = body.daysBefore ?? [7, 1];
    const eventTypes = body.eventTypes ?? ["European Cup", "3 Nations Cup"];

    const today = new Date();
    const targetDates: string[] = [];

    for (const days of daysBefore) {
      const target = new Date(today);
      target.setDate(target.getDate() + days);
      targetDates.push(target.toISOString().split("T")[0]);
    }

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(`
        id,
        title,
        registration_deadline,
        registration_url,
        event_type:event_types!events_event_type_id_fkey(name)
      `)
      .not("registration_deadline", "is", null)
      .in("registration_deadline", targetDates);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch events" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filteredEvents = (events as EventRow[]).filter(e =>
      e.event_type && eventTypes.includes(e.event_type.name)
    );

    if (filteredEvents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No events with approaching deadlines" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const event of filteredEvents) {
      const daysLabel = getDaysLabel(event.registration_deadline, today);

      for (const sub of subscriptions as PushSubscriptionRow[]) {
        const payload = JSON.stringify({
          title: `Inschrijvingsdeadline: ${event.title}`,
          body: `De inschrijving sluit over ${daysLabel}. Schrijf je nu in!`,
          url: event.registration_url || "/",
          tag: `deadline-${event.id}`,
        });

        try {
          await webPushKey.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          }, payload);
          sentCount++;
        } catch (err) {
          console.error(`Push failed for subscription ${sub.id}:`, err);
          failedCount++;

          if (err instanceof Error && err.message.includes("410")) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        events: filteredEvents.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getDaysLabel(deadline: string, today: Date): string {
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return "1 dag";
  if (diffDays <= 7) return `${diffDays} dagen`;
  return `${diffDays} dagen`;
}
