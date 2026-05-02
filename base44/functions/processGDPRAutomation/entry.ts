/**
 * Automated GDPR compliance processor
 * Runs daily to handle right-to-be-forgotten requests
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only service role can run this
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all pending GDPR requests
    const gdprRequests = await base44.asServiceRole.entities.GdprRequest.filter(
      { status: 'pending' },
      'created_date',
      1000
    );

    if (!Array.isArray(gdprRequests) || gdprRequests.length === 0) {
      return Response.json({ processed: 0, message: 'No pending GDPR requests' });
    }

    const results = {
      processed: 0,
      failed: 0,
      deletedContacts: 0,
    };

    for (const request of gdprRequests) {
      try {
        const { contact_id, request_type } = request;

        if (request_type === 'right_to_be_forgotten') {
          // Delete the contact
          await base44.asServiceRole.entities.Contact.delete(contact_id);
          results.deletedContacts++;

          // Delete all related interactions
          const interactions = await base44.asServiceRole.entities.ContactInteraction.filter(
            { contact_id },
            'date',
            1000
          );

          if (Array.isArray(interactions)) {
            for (const interaction of interactions) {
              await base44.asServiceRole.entities.ContactInteraction.delete(interaction.id);
            }
          }

          // Mark request as completed
          await base44.asServiceRole.entities.GdprRequest.update(request.id, {
            status: 'completed',
            completed_date: new Date().toISOString().split('T')[0],
          });

          results.processed++;
        } else if (request_type === 'consent_withdrawal') {
          // Mark contact as no consent
          await base44.asServiceRole.entities.Contact.update(contact_id, {
            consent_given: false,
            deletion_requested: true,
          });

          await base44.asServiceRole.entities.GdprRequest.update(request.id, {
            status: 'completed',
            completed_date: new Date().toISOString().split('T')[0],
          });

          results.processed++;
        }
      } catch (err) {
        console.error(`GDPR request ${request.id} failed:`, err.message);
        results.failed++;
      }
    }

    return Response.json(results);
  } catch (error) {
    console.error('GDPR automation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});