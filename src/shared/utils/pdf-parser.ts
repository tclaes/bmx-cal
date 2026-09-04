import { supabase } from '@data/supabase';
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

  console.log('Supabase URL:', supabaseUrl);
  console.log('Has Anon Key:', !!supabaseAnonKey);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const apiUrl = `${supabaseUrl}/functions/v1/analyze-pdf`;
  console.log('Calling edge function:', apiUrl);

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('You need to be signed in to import a document.');
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseAnonKey,
      },
      body: formData,
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }
      throw new Error(error.error || 'Failed to analyze PDF');
    }

    const data: PDFAnalysisResponse = await response.json();
    console.log('PDF analysis response:', data);

    if (!data.success || !data.events) {
      throw new Error('Failed to extract events from PDF');
    }

    return data.events.map((event, index) => ({
      title: event.title || `Event ${index + 1}`,
      date: event.start_date,
      location: event.location || '',
      description: event.description || '',
      event_type: event.event_type || 'race',
    }));
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw error;
  }
}
