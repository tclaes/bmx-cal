import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExtractedEvent {
  title: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  description?: string;
  event_type?: string;
  class_categories?: string[];
  age_groups?: string[];
  registration_url?: string;
  contact_info?: string;
}

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

async function analyzeImageWithAI(
  imageBuffer: ArrayBuffer,
  mimeType: string
): Promise<ExtractedEvent[]> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }
  void geminiApiKey.length;

  const bytes = new Uint8Array(imageBuffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);

  const prompt = `You are an expert at extracting BMX and cycling event information from images.
Analyze the provided image and extract ALL events, including trainings, coaching sessions, races, and competitions.

IMPORTANT: Count every single entry in the image. Do not skip or merge any events. If the image lists 16 training sessions, return all 16 as separate events.

For each event, provide:
- title: Event name as shown in the image
- start_date: ISO 8601 date (YYYY-MM-DD)
- end_date: ISO 8601 date if multi-day event
- start_time: Start time in HH:MM 24-hour format if mentioned (e.g., "14:00")
- end_time: End time in HH:MM 24-hour format if mentioned (e.g., "16:00")
- location: Venue/track name and location if mentioned
- description: Event description if available
- event_type: Choose the most appropriate from these options:
  * "Training" for: training sessions, MTB training, coaching, practice, skills sessions, team training
  * "Race" for: races, racing, competition, championship, regional, national, provincial, grand prix
  * "European Cup" for: European Cup events, UEC events, European championship rounds
  * "World Cup" for: World Cup events, UCI World Cup, world championship rounds
  * "3 Nations Cup" for: 3 Nations Cup events
  * "Belgian Cycling" for: Belgian Cycling events, BK events, Belgian championship
  * "Cycling Vlaanderen" for: Cycling Vlaanderen events, Vlaanderen events
  * "Wallonie Cycling" for: Wallonie Cycling events, Walloon events
  * "Dare2Race" for: Dare2Race events, D2R events
  * "Freestyle" for: freestyle competitions, tricks, stunts
  * "Park" for: park events, skateparks, park competitions
  * "Street" for: street events, street competitions
  * "Dirt" for: dirt jumping, dirt events
  * "Flatland" for: flatland competitions
- class_categories: Array of racing classes if applicable (e.g., ["Novice", "Intermediate", "Expert"])
- age_groups: Array of age groups if applicable (e.g., ["5-6", "7-8", "9-10"])
- registration_url: URL for registration if available
- contact_info: Contact information if available

If the image is blurry, unclear, or does not contain event information, return an empty array.

Return ONLY a valid JSON array of events. If no events found, return empty array [].`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 16384,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("No valid JSON found in AI response");
  }

  const events = JSON.parse(jsonMatch[0]);
  return events;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const role = user.app_metadata?.role;
    if (role !== "admin") {
      const { data: teamManager } = await userClient
        .from("team_managers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!teamManager) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const formData = await req.formData();
    const imageFile = formData.get("file") as File;

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: "No image file provided" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const fileType = imageFile.type.toLowerCase();
    if (!ACCEPTED_TYPES.has(fileType)) {
      return new Response(
        JSON.stringify({ error: "File must be an image (JPG, PNG, or WebP)" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const imageBuffer = await imageFile.arrayBuffer();
    const events = await analyzeImageWithAI(imageBuffer, fileType);

    return new Response(
      JSON.stringify({
        success: true,
        events,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing image:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process image",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
