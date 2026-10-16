## File Import System

Admins can bulk import events from uploaded files. Supported formats:

### CSV

```csv
title,date,location,event_type,description,start_time,end_time
BMX Race Championship,2026-06-15,Kessel-Lo,Race,Annual championship,10:00,16:00
```

### Excel (.xlsx, .xls)

Same columns as CSV.

### iCalendar (.ics)

Standard iCalendar format with VEVENT entries.

### PDF

Event data extracted via the `analyze-pdf` edge function.

### Column Mapping

The parser accepts flexible column names:

| Field | Accepted headers |
|-------|-----------------|
| Title | `title`, `Title`, `event`, `Event` |
| Date | `date`, `Date` (YYYY-MM-DD format) |
| Location | `location`, `Location`, `venue`, `Venue` |
| Event Type | `event_type`, `Event_Type`, `type`, `Type` |
| Description | `description`, `Description` |
| Start Time | `start_time`, `Start_Time`, `time`, `Time` |
| End Time | `end_time`, `End_Time` |

### Validation Rules

- Title is required
- Date is required (YYYY-MM-DD format)
- Location is required
- Event type is optional (mapped to existing types if provided)
- Times are optional (HH:MM format)