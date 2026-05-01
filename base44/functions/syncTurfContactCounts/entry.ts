import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all contacts and turfs
    const contacts = await base44.entities.Contact.list('', 10000);
    const turfs = await base44.entities.Turf.list('', 10000);

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
    for (const turf of turfs) {
      const newCount = turfCounts[turf.name] || 0;
      if (turf.contact_count !== newCount) {
        await base44.entities.Turf.update(turf.id, { contact_count: newCount });
        updated++;
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