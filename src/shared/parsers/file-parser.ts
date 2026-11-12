import type { ParsedEvent } from '@types';
import { parseCSV } from './csv-parser';
import { parseExcel } from './excel-parser';
import { parseICalendar } from './ical-parser';
import { parsePDF } from './pdf-parser';
import { parseImage } from './image-parser';

export async function parseFile(file: File): Promise<ParsedEvent[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'csv':
      return parseCSV(file);
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    case 'ics':
    case 'ical':
      return parseICalendar(file);
    case 'pdf':
      return parsePDF(file);
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
      return parseImage(file);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

export function getSupportedFileTypes(): string {
  return '.csv,.xlsx,.xls,.ics,.ical,.pdf,.jpg,.jpeg,.png,.webp';
}
