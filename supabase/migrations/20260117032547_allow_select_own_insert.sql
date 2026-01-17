-- Drop existing policy if it exists (in case of conflicts)
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.catering_requests;

-- Ensure RLS is enabled
ALTER TABLE public.catering_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT (for the public catering form)
CREATE POLICY "Allow public inserts" ON public.catering_requests
FOR INSERT 
TO public
WITH CHECK (true);

-- Allow selecting just-inserted rows (for returning data)
CREATE POLICY "Allow public select" ON public.catering_requests
FOR SELECT
TO public
USING (true);
