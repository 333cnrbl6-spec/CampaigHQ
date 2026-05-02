import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaign_id, route, turf_name, contact_details } = await req.json();

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }
    if (!route || !contact_details) {
      return Response.json({ error: 'Missing route or contact_details' }, { status: 400 });
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Title and header
    doc.setFontSize(18);
    doc.setTextColor(25, 103, 71); // Primary green
    doc.text('Canvassing Route', 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Turf: ${turf_name || 'Route'}`, 20, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 20, 37);
    doc.text(`Volunteer: ________________`, 20, 44);

    // Route summary
    let y = 55;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Route Summary', 20, y);
    y += 7;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total Stops: ${route.length}`, 20, y);
    y += 6;
    doc.text(`Date: ________________`, 20, y);
    y += 6;
    doc.text(`Start Time: ________  End Time: ________`, 20, y);

    // Contact details table
    y += 12;
    doc.setFont(undefined, 'bold');
    doc.text('Contact Details & Checklist', 20, y);
    y += 7;

    // Table headers
    doc.setFillColor(242, 245, 240); // Light background
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);

    const col1 = 20;
    const col2 = 35;
    const col3 = 80;
    const col4 = 140;
    const col5 = 170;

    doc.rect(col1, y - 3, 155, 5, 'F');
    doc.text('#', col1, y);
    doc.text('Name', col2, y);
    doc.text('Address', col3, y);
    doc.text('Support', col4, y);
    doc.text('✓', col5, y);

    y += 6;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);

    // Add contacts
    route.forEach((stop, idx) => {
      const contact = contact_details[stop.id];
      if (!contact) return;

      // Check if we need a new page
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const stopNum = idx + 1;
      const name = contact.name?.substring(0, 15) || '';
      const address = contact.address?.substring(0, 45) || '';
      const support = contact.support_level?.substring(0, 6) || 'N/A';

      doc.text(stopNum.toString(), col1, y);
      doc.text(name, col2, y);
      doc.text(address, col3, y);
      doc.text(support, col4, y);
      doc.text('☐', col5, y);

      y += 5;
    });

    // Notes section
    y += 8;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('Session Notes', 20, y);
    y += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text('_________________________________________________________________', 20, y);
    y += 6;
    doc.text('_________________________________________________________________', 20, y);
    y += 6;
    doc.text('_________________________________________________________________', 20, y);

    // Summary footer
    y += 10;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('End of Route Summary', 20, y);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for volunteering!', 20, y + 6);

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="route-${turf_name?.replace(/\s+/g, '-')}-${new Date().getTime()}.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});