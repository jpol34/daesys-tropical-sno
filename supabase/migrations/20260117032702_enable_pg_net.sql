-- Enable pg_net extension for HTTP requests (webhooks, notifications)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to authenticated and anon roles
GRANT USAGE ON SCHEMA net TO anon, authenticated, service_role;
