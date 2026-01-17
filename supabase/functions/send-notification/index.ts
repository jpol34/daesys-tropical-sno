import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface CateringRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  event_date: string;
  event_type: string;
  customer_notes: string | null;
  created_at: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { record } = await req.json() as { record: CateringRequest };

    if (!record) {
      return new Response(JSON.stringify({ error: "No record provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Format the event date nicely
    const eventDate = new Date(record.event_date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const submittedAt = new Date(record.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    // Build the email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Catering Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e5799 0%, #0d3a6e 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">🌴 New Catering Request!</h1>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 16px 16px;">
    <p style="margin-top: 0;">A new catering request has been submitted:</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
      <h2 style="margin: 0 0 15px 0; color: #1e5799; font-size: 18px;">Customer Information</h2>
      <p style="margin: 8px 0;"><strong>Name:</strong> ${record.name}</p>
      <p style="margin: 8px 0;"><strong>Phone:</strong> <a href="tel:${record.phone}" style="color: #1e5799;">${record.phone}</a></p>
      <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${record.email}" style="color: #1e5799;">${record.email}</a></p>
    </div>
    
    <div style="background: #fff9e6; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #ffd700;">
      <h2 style="margin: 0 0 15px 0; color: #1e5799; font-size: 18px;">Event Details</h2>
      <p style="margin: 8px 0;"><strong>Type:</strong> ${record.event_type}</p>
      <p style="margin: 8px 0;"><strong>Date:</strong> ${eventDate}</p>
      ${record.customer_notes ? `<p style="margin: 8px 0;"><strong>Notes:</strong> ${record.customer_notes}</p>` : ""}
    </div>
    
    <div style="text-align: center; margin-top: 25px;">
      <a href="https://daesyssno.com/admin" style="display: inline-block; background: #e63946; color: #fff; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600;">View in Dashboard</a>
    </div>
    
    <p style="color: #666; font-size: 12px; margin-top: 25px; text-align: center;">
      Submitted on ${submittedAt}
    </p>
  </div>
</body>
</html>
    `.trim();

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Daesy's Tropical Sno <notifications@daesyssno.com>",
        to: ["info@daesyssno.com"],
        subject: `🌴 New Catering Request: ${record.event_type} - ${record.name}`,
        html: emailHtml,
        reply_to: record.email,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: data }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
