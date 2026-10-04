import { supabase } from '@data/supabase';
import type { ParsedEvent } from '@types';

interface ImageAnalysisResponse {
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
  error?: string;
}

export async function parseImage(file: File): Promise<ParsedEvent[]> {
  const formData = new FormData();
  formData.append('file', file);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const apiUrl = `${supabaseUrl}/functions/v1/analyze-image`;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('You need to be signed in to import an image.');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': supabaseAnonKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let error;
    try {
      error = JSON.parse(errorText);
    } catch {
      error = { error: errorText };
    }
    throw new Error(error.error || 'Failed to analyze image');
  }

  const data: ImageAnalysisResponse = await response.json();

  if (!data.success || !data.events) {
    throw new Error('Failed to extract events from image');
  }

  if (data.events.length === 0) {
    throw new Error('Could not read any events from this image. Try a clearer photo or use a PDF/CSV file instead.');
  }

  return data.events.map((event, index) => ({
    title: event.title || `Event ${index + 1}`,
    date: event.start_date,
    end_date: event.end_date,
    location: event.location || '',
    description: event.description || '',
    event_type: event.event_type || 'race',
  }));
}
