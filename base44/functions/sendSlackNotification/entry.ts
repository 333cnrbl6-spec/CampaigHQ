import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { webhook_url, title, message, campaign_name, event_type, details } = await req.json();

    if (!webhook_url) {
      return Response.json({ error: 'Slack webhook URL required' }, { status: 400 });
    }

    // Color coding by event type
    const colorMap = {
      alert: '#FF6B6B',
      success: '#51CF66',
      info: '#4DABF7',
      warning: '#FFC40F',
    };

    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: title,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Campaign:* ${campaign_name} | *Time:* ${new Date().toLocaleString()} | *Type:* ${event_type}`,
            },
          ],
        },
      ],
      attachments: details ? [{
        color: colorMap[event_type] || colorMap.info,
        text: details,
      }] : undefined,
    };

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return Response.json({ success: true, message: 'Slack notification sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});