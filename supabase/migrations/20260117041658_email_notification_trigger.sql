-- Create a function to send email notification via Edge Function
CREATE OR REPLACE FUNCTION notify_new_catering_request()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Build the payload with the new record
  payload := jsonb_build_object('record', row_to_json(NEW));
  
  -- Call the edge function using pg_net
  PERFORM net.http_post(
    url := 'https://mvdtocalonyoqctgqlha.supabase.co/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := payload
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on catering_requests table
DROP TRIGGER IF EXISTS on_new_catering_request ON catering_requests;

CREATE TRIGGER on_new_catering_request
  AFTER INSERT ON catering_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_catering_request();
