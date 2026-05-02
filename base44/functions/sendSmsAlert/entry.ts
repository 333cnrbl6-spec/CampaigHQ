import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone_number, message, campaign_name } = await req.json();

    if (!phone_number || !message) {
      return Response.json({ error: 'Phone number and message required' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !twilioPhone) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const auth = btoa(`${accountSid}:${authToken}`);
    const formData = new URLSearchParams({
      From: twilioPhone,
      To: phone_number,
      Body: message,
    });

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Twilio error: ${data.message || response.statusText}`);
    }

    return Response.json({ success: true, message_sid: data.sid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});