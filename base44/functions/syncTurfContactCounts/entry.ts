import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign_id } = body;

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // Fetch contacts and turfs for this campaign only
    const contacts = await base44.asServiceRole.entities.Contact.filter({ campaign_id }, '', 10000);
    const turfs = await base44.asServiceRole.entities.Turf.filter({ campaign_id }, '', 10000);

    // Count contacts per turf tag
    const turfCounts = {};
    contacts.forEach(contact => {
      if (contact.tags && Array.isArray(contact.tags)) {
        contact.tags.forEach(tag => {
          turfCounts[tag] = (turfCounts[tag] || 0) + 1;
        });
      }
    });

    // Update turfs with accurate contact counts
    let updated = 0;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < turfs.length; i++) {
     const turf = turfs[i];
     const newCount = turfCounts[turf.name] || 0;
     if (turf.contact_count !== newCount) {
       try {
         await base44.asServiceRole.entities.Turf.update(turf.id, { contact_count: newCount });
         updated++;
       } catch (err) {
         console.error(`Failed to update turf ${turf.id}:`, err.message);
       }
     }
     // Rate limit: pause every 3 updates
     if ((i + 1) % 3 === 0) {
       await delay(200);
     }
    }

    return Response.json({
      success: true,
      turfs_synced: turfs.length,
      turfs_updated: updated,
      total_contacts: contacts.length,
      turf_distribution: turfCounts
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});