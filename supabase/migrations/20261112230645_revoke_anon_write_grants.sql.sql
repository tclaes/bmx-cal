REVOKE INSERT, UPDATE, DELETE ON event_types, events, import_logs, locations, news, notification_preferences, push_subscriptions, team_managers, team_members, teams, user_calendar_events, user_calendars, user_event_selections FROM anon;
REVOKE SELECT, UPDATE, DELETE ON bug_reports FROM anon;
