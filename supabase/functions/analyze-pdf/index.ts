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

async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdfjs = await import("npm:pdfjs-dist@4.0.379");

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      standardFontDataUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/standard_fonts/",
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

async function analyzeTextWithAI(text: string): Promise<ExtractedEvent[]> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `You are an expert at extracting BMX racing event information from text.
Analyze the following text and extract all BMX racing events. For each event, provide:
- title: Event name
- start_date: ISO 8601 date (YYYY-MM-DD)
- end_date: ISO 8601 date if multi-day event
- location: Venue/track name and location
- description: Event description
- event_type: One of [race, practice, clinic, championship, regional, national]
- class_categories: Array of racing classes (e.g., ["Novice", "Intermediate", "Expert"])
- age_groups: Array of age groups (e.g., ["5-6", "7-8", "9-10"])
- registration_url: URL for registration if available
- contact_info: Contact information if available

Return ONLY valid JSON array of events. If no events found, return empty array [].

Text to analyze:
${text}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
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
    throw new Error('No valid JSON found in AI response');
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

    const formData = await req.formData();
    const pdfFile = formData.get("file") as File;

    if (!pdfFile) {
      return new Response(
        JSON.stringify({ error: "No PDF file provided" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (pdfFile.type !== "application/pdf") {
      return new Response(
        JSON.stringify({ error: "File must be a PDF" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const pdfBuffer = await pdfFile.arrayBuffer();

    const extractedText = await extractTextFromPDF(pdfBuffer);

    const events = await analyzeTextWithAI(extractedText);

    return new Response(
      JSON.stringify({
        success: true,
        events,
        extractedText: extractedText.substring(0, 500),
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
    console.error("Error processing PDF:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process PDF",
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
