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

  const base64 = btoa(
    String.fromCharCode(...new Uint8Array(imageBuffer))
  );

  const prompt = `You are an expert at extracting BMX event information from images.
Analyze the provided image and extract all BMX events. For each event, provide:
- title: Event name
- start_date: ISO 8601 date (YYYY-MM-DD)
- end_date: ISO 8601 date if multi-day event
- location: Venue/track name and location
- description: Event description
- event_type: One of these exact values [Race, Freestyle, Park, Street, Dirt, Flatland]
  * Use "Race" for: races, racing, competition, championship, regional, national, provincial
  * Use "Freestyle" for: freestyle competitions, tricks, stunts
  * Use "Park" for: park events, skateparks, park competitions
  * Use "Street" for: street events, street competitions
  * Use "Dirt" for: dirt jumping, dirt events
  * Use "Flatland" for: flatland competitions
- class_categories: Array of racing classes if applicable (e.g., ["Novice", "Intermediate", "Expert"])
- age_groups: Array of age groups if applicable (e.g., ["5-6", "7-8", "9-10"])
- registration_url: URL for registration if available
- contact_info: Contact information if available

IMPORTANT: Match event_type to one of the exact values above based on the event description.
If the image is blurry, unclear, or does not contain event information, return an empty array.

Return ONLY valid JSON array of events. If no events found, return empty array [].`;

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
