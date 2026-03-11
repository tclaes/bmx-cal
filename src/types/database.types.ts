export interface EventType {
  id: string;
  name: string;
  color_code: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string;
  event_type_id: string | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface EventWithType extends Event {
  event_type: EventType | null;
}

export interface ImportLog {
  id: string;
  filename: string;
  imported_by: string | null;
  imported_at: string;
  events_count: number;
  status: 'success' | 'partial' | 'failed';
  error_log: Array<{ row: number; error: string }>;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  location: string;
  event_type_id?: string;
  status?: 'upcoming' | 'completed' | 'cancelled';
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

export interface ParsedEvent {
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  event_type?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; error: string }>;
}
