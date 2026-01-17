-- Allow anonymous users to insert catering requests (public form)
CREATE POLICY "Allow anonymous inserts" ON catering_requests
FOR INSERT TO anon WITH CHECK (true);
