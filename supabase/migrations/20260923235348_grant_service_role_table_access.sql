-- Give the service role the table privileges the first migration assumed it had.
--
-- That migration relied on "the service role bypasses RLS" — true, but RLS is
-- only the second gate. Table privileges are the first, and with "Automatically
-- expose new tables" off at project creation, no API role got them, service_role
-- included: it held only TRIGGER, TRUNCATE and REFERENCES, so every read or
-- write from the send command or a route handler failed with 403.
--
-- anon and authenticated stay at nothing; RLS stays on with no policies.
grant select, insert, update, delete on subscribers, sends, events to service_role;

-- rls_auto_enable() backs Supabase's `ensure_rls` event trigger, which turns
-- RLS on for every new table in `public`. It is SECURITY DEFINER and was
-- executable by the API roles over /rest/v1/rpc. As an event-trigger function
-- a direct call can only error, but nothing outside Postgres should reach it.
-- The event trigger still fires: it runs the function as its owner.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
