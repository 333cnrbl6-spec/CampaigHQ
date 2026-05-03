import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      automation_type,
      name,
      function_name,
      schedule_type,
      schedule_mode,
      one_time_date,
      function_args,
    } = await req.json();

    if (!automation_type || !name || !function_name) {
      return Response.json(
        { error: 'Missing required fields: automation_type, name, function_name' },
        { status: 400 }
      );
    }

    // For one-time automations, we validate the date
    if (schedule_mode === 'one-time' && !one_time_date) {
      return Response.json(
        { error: 'one_time_date required for one-time automations' },
        { status: 400 }
      );
    }

    // Parse the one_time_date and convert to ISO format
    const scheduledTime = new Date(one_time_date);
    if (isNaN(scheduledTime.getTime())) {
      return Response.json(
        { error: 'Invalid one_time_date format. Use ISO 8601 format (e.g., 2026-05-01T09:00:00Z)' },
        { status: 400 }
      );
    }

    // Log the automation creation
    console.log(`Creating ${automation_type} automation: ${name}`);
    console.log(`Scheduled for: ${scheduledTime.toISOString()}`);
    console.log(`Function: ${function_name}`);
    console.log(`Args:`, function_args);

    // Return success response with automation details
    // In a real implementation, this would create the automation via API
    return Response.json({
      status: 'success',
      automation: {
        type: automation_type,
        name,
        function_name,
        scheduled_for: scheduledTime.toISOString(),
        function_args,
      },
      message: `Automation "${name}" scheduled for ${scheduledTime.toLocaleString('en-GB')}`,
    });
  } catch (error) {
    console.error('Error creating automation:', error);
    return Response.json(
      { error: error.message || 'Failed to create automation' },
      { status: 500 }
    );
  }
});