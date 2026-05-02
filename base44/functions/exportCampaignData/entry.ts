import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { entity_type, format = 'csv', filter_campaign_id = null } = body;

    // Determine which campaign to filter by
    const campaignId = filter_campaign_id || user.campaign_id;
    
    // Non-admins must have campaign_id
    if (!campaignId && user.role !== 'admin') {
      return Response.json({ error: 'No campaign selected and user has no default campaign' }, { status: 400 });
    }
    
    // Admins exporting without campaign_id should be logged
    if (!campaignId && user.role === 'admin') {
      console.warn(`Admin ${user.email} exporting all data without campaign filter`);
    }

    let records = [];
    let filename = '';

    // Fetch and filter data by campaign_id if present
    switch (entity_type) {
      case 'contacts': {
        const all = await base44.entities.Contact.list('name', 10000);
        records = campaignId ? all.filter(r => r.campaign_id === campaignId) : all;
        filename = `contacts-${campaignId || 'all'}-${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      }
      case 'turfs': {
        const all = await base44.entities.Turf.list('name', 1000);
        records = campaignId ? all.filter(r => r.campaign_id === campaignId) : all;
        filename = `turfs-${campaignId || 'all'}-${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      }
      case 'canvassing_logs': {
        const all = await base44.entities.CanvassingLog.list('session_date', 5000);
        records = campaignId ? all.filter(r => r.campaign_id === campaignId) : all;
        filename = `canvassing-logs-${campaignId || 'all'}-${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      }
      case 'interactions': {
        const all = await base44.entities.ContactInteraction.list('date', 5000);
        // ContactInteraction has contact_id, need to filter by contacts in this campaign
        if (campaignId) {
          const contacts = await base44.entities.Contact.list('name', 10000);
          const campaignContactIds = contacts.filter(c => c.campaign_id === campaignId).map(c => c.id);
          records = all.filter(r => campaignContactIds.includes(r.contact_id));
        } else {
          records = all;
        }
        filename = `interactions-${campaignId || 'all'}-${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      }
      case 'tasks': {
        const all = await base44.entities.Task.list('title', 1000);
        records = campaignId ? all.filter(r => r.campaign_id === campaignId) : all;
        filename = `tasks-${campaignId || 'all'}-${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      }
      case 'events': {
        const all = await base44.entities.CampaignEvent.list('date', 1000);
        records = campaignId ? all.filter(r => r.campaign_id === campaignId) : all;
        filename = `events-${campaignId || 'all'}-${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      }
      case 'leaflet_runs': {
        const all = await base44.entities.LeafletRun.list('street_name', 5000);
        records = campaignId ? all.filter(r => r.campaign_id === campaignId) : all;
        filename = `leaflet-runs-${campaignId || 'all'}-${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      }
      default:
        return Response.json({ error: 'Unknown entity type' }, { status: 400 });
    }

    if (records.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No records found for export',
        count: 0
      });
    }

    // Convert to CSV
    if (format === 'csv') {
      const headers = Object.keys(records[0]).filter(k => !k.startsWith('_'));
      const csvLines = [headers.join(',')];
      
      records.forEach(record => {
        const values = headers.map(h => {
          const val = record[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
          if (Array.isArray(val)) return `"${val.join('; ')}"`;
          if (typeof val === 'object') return `"${JSON.stringify(val)}"`;
          return val;
        });
        csvLines.push(values.join(','));
      });

      const csv = csvLines.join('\n');
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        }
      });
    }

    // Convert to JSON (alternative)
    if (format === 'json') {
      filename = filename.replace('.csv', '.json');
      const json = JSON.stringify(records, null, 2);
      return new Response(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        }
      });
    }

    return Response.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});