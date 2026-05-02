import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active trials
    const trials = await base44.asServiceRole.entities.Subscription.filter({ status: 'trial' }, '', 10000);

    const now = new Date();
    let expiredCount = 0;

    for (const trial of trials) {
      const trialEnd = new Date(trial.trial_end_date);
      
      // If trial has ended, mark as expired
      if (trialEnd < now) {
        await base44.asServiceRole.entities.Subscription.update(trial.id, {
          status: 'expired',
        });
        expiredCount++;

        // TODO: Send email notification
        console.log(`Trial expired for campaign: ${trial.campaign_id}`);
      }
    }

    return Response.json({
      success: true,
      message: `${expiredCount} trials marked as expired`,
      processed: expiredCount,
    });
  } catch (error) {
    console.error('Trial expiration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});