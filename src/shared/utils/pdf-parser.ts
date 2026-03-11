import type { ParsedEvent } from '@types';

interface PDFAnalysisResponse {
  success: boolean;
  events: Array<{
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
  }>;
  extractedText?: string;
  error?: string;
}

export async function parsePDF(file: File): Promise<ParsedEvent[]> {
  const formData = new FormData();
  formData.append('file', file);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const apiUrl = `${supabaseUrl}/functions/v1/analyze-pdf`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze PDF');
  }

  const data: PDFAnalysisResponse = await response.json();

  if (!data.success || !data.events) {
    throw new Error('Failed to extract events from PDF');
  }

  return data.events.map((event, index) => ({
    title: event.title || `Event ${index + 1}`,
    date: event.start_date,
    endDate: event.end_date,
    location: event.location || '',
    description: event.description || '',
    eventType: event.event_type || 'race',
    classCategories: event.class_categories || [],
    ageGroups: event.age_groups || [],
    registrationUrl: event.registration_url,
    contactInfo: event.contact_info,
  }));
}
