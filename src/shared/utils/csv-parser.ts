import Papa from 'papaparse';
import type { ParsedEvent } from '@types';

export async function parseCSV(file: File): Promise<ParsedEvent[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const events = results.data.map((row: any) => ({
            title: row.title || row.Title || row.event || row.Event || '',
            description: row.description || row.Description || '',
            date: row.date || row.Date || '',
            start_time: row.start_time || row.Start_Time || row.time || row.Time || null,
            end_time: row.end_time || row.End_Time || null,
            location: row.location || row.Location || row.venue || row.Venue || '',
            event_type: row.event_type || row.Event_Type || row.type || row.Type || null,
          }));
          resolve(events);
        } catch (error) {
          reject(new Error('Failed to parse CSV file'));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}
