import * as XLSX from 'xlsx';
import type { ParsedEvent } from '@types';

export async function parseExcel(file: File): Promise<ParsedEvent[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);

        const events = jsonData.map((row) => ({
          title: row.title || row.Title || row.event || row.Event || '',
          description: row.description || row.Description || '',
          date: formatExcelDate(row.date || row.Date || ''),
          start_time: row.start_time || row.Start_Time || row.time || row.Time || null,
          end_time: row.end_time || row.End_Time || null,
          location: row.location || row.Location || row.venue || row.Venue || '',
          event_type: row.event_type || row.Event_Type || row.type || row.Type || null,
        }));

        resolve(events);
      } catch (error) {
        reject(new Error('Failed to parse Excel file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };

    reader.readAsBinaryString(file);
  });
}

function formatExcelDate(value: any): string {
  if (!value) return '';

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const year = date.y;
      const month = String(date.m).padStart(2, '0');
      const day = String(date.d).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return '';
}
