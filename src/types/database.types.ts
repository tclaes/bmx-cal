export interface EventType {
  id: string;
  name: string;
  color_code: string;
  team_id: string | null;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  maps_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string;
  location_id: string | null;
  event_type_id: string | null;
  related_event_type_id: string | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  registration_url: string | null;
  registration_opens: string | null;
  registration_deadline: string | null;
  registration_status: string | null;
  livestream_url: string | null;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventWithType extends Event {
  event_type: EventType | null;
}

export interface EventWithDetails extends Event {
  event_type: EventType | null;
  location_details: Location | null;
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

export interface Team {
  id: string;
  name: string;
  created_at: string;
}

export interface TeamManager {
  id: string;
  user_id: string;
  team_id: string;
  created_at: string;
  team?: Team;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  created_at: string;
  team?: Team;
  user_email?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  teams?: Team[];
  managedTeams?: Team[];
}

export interface CreateEventInput {
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location: string;
  location_id?: string;
  event_type_id?: string;
  related_event_type_id?: string;
  team_id?: string;
  status?: 'upcoming' | 'completed' | 'cancelled';
  registration_url?: string;
  registration_opens?: string;
  registration_deadline?: string;
  registration_status?: string;
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
