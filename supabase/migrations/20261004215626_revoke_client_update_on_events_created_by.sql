/*
  The client never writes events.created_by (it is defaulted to auth.uid()),
  so take UPDATE on that single column away from the browser roles. All other
  columns remain updatable under the existing event policies.
*/
REVOKE UPDATE (created_by) ON public.events FROM anon;
REVOKE UPDATE (created_by) ON public.events FROM authenticated;
