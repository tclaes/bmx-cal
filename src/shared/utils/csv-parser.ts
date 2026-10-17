import Papa from 'papaparse';
import type { ParsedEvent } from '@types';
import { normalizeRow } from './row-mapper';

export async function parseCSV(file: File): Promise<ParsedEvent[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        try {
          resolve(results.data.map((row) => normalizeRow(row)));
        } catch {
          reject(new Error('Failed to parse CSV file'));
        }
      },
      error: (error: Papa.ParseError) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}
