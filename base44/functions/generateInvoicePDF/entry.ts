import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { subscription_id, campaign_id } = await req.json();

    if (!subscription_id || !campaign_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subscription = await base44.asServiceRole.entities.Subscription.filter(
      { id: subscription_id },
      '',
      1
    ).then(r => r[0]);

    const campaign = await base44.asServiceRole.entities.Campaign.filter(
      { id: campaign_id },
      '',
      1
    ).then(r => r[0]);

    if (!subscription || !campaign) {
      return Response.json({ error: 'Subscription or campaign not found' }, { status: 404 });
    }

    const doc = new jsPDF();
    const invoiceId = `INV-${subscription_id.slice(0, 8).toUpperCase()}-${Date.now()}`;
    const invoiceDate = new Date().toLocaleDateString('en-GB');

    // Header
    doc.setFontSize(20);
    doc.text('INVOICE', 20, 20);

    // Invoice details
    doc.setFontSize(10);
    doc.text(`Invoice ID: ${invoiceId}`, 20, 35);
    doc.text(`Invoice Date: ${invoiceDate}`, 20, 42);
    doc.text(`Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}`, 20, 49);

    // Bill To
    doc.setFontSize(12);
    doc.text('Bill To:', 20, 65);
    doc.setFontSize(10);
    doc.text(campaign.name, 20, 72);
    doc.text(`${campaign.candidate_name} • ${campaign.constituency}`, 20, 79);
    doc.text(campaign.owner_email, 20, 86);

    // Invoice items table
    doc.setFontSize(11);
    doc.text('Description', 20, 105);
    doc.text('Amount', 140, 105);

    doc.setFontSize(10);
    const planName = subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1);
    doc.text(`${planName} Plan (Monthly Subscription)`, 20, 115);
    doc.text(`£${subscription.monthly_price.toFixed(2)}`, 140, 115);

    // Total
    doc.setFontSize(12);
    doc.text('Total Amount Due:', 120, 135);
    doc.text(`£${subscription.monthly_price.toFixed(2)}`, 140, 135);

    // Payment info
    doc.setFontSize(10);
    doc.text(`Payment Method: Card ending in ${subscription.payment_method || '****'}`, 20, 160);
    doc.text('Status: Paid', 20, 167);

    // Footer
    doc.setFontSize(8);
    doc.text('Thank you for your business!', 20, 270);
    doc.text('Questions? Contact support@campaign-platform.com', 20, 277);

    return new Response(doc.output('arraybuffer'), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});