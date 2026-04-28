import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contactId, supportLevel, keyIssues } = await req.json();

    // Fetch contact details
    const contact = await base44.entities.Contact.get(contactId);

    // Fetch recent interactions for this contact
    const interactions = await base44.entities.ContactInteraction.filter(
      { contact_id: contactId },
      '-date',
      10
    );

    // Fetch campaign issues
    const issues = await base44.entities.Issue.list('-priority', 50);

    // Generate script using LLM
    const prompt = `You are a campaign canvassing script expert. Generate a personalized canvassing script for a volunteer.

Contact Information:
- Name: ${contact.name}
- Address: ${contact.address}
- Support Level: ${supportLevel || contact.support_level}
- Registered Voter: ${contact.registered_voter ? 'Yes' : 'No'}
- Previous Notes: ${contact.notes || 'None'}

${interactions.length > 0 ? `Recent Interactions:\n${interactions.map(i => `- ${i.date}: ${i.type} - Outcome: ${i.outcome}\n  Notes: ${i.notes || 'N/A'}`).join('\n')}` : ''}

Campaign Issues to Reference:
${issues.slice(0, 5).map(issue => `- ${issue.title} (Priority: ${issue.priority}): ${issue.policy_position}`).join('\n')}

Generate a canvassing script that includes:
1. A persuasive opening line tailored to their support level (supporters are friendly, undecideds are inquisitive, opponents are respectful)
2. 2-3 follow-up questions based on common responses
3. Talking points about the campaign issues
4. Transition techniques based on their previous interactions if available
5. A clear call-to-action or close

Format as a JSON object with these fields:
{
  "opening": "...",
  "followUpQuestions": ["...", "...", "..."],
  "talkingPoints": ["...", "...", "..."],
  "handleObjections": {
    "common_objection_1": "response",
    "common_objection_2": "response"
  },
  "close": "..."
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          opening: { type: 'string' },
          followUpQuestions: { type: 'array', items: { type: 'string' } },
          talkingPoints: { type: 'array', items: { type: 'string' } },
          handleObjections: { type: 'object', additionalProperties: { type: 'string' } },
          close: { type: 'string' }
        },
        required: ['opening', 'followUpQuestions', 'talkingPoints', 'handleObjections', 'close']
      }
    });

    return Response.json({ script: response });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});