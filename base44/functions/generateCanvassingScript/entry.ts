import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contact, support_level, interactions, issues, feedback } = await req.json();

    const supportDescriptions = {
      strong_supporter: 'a strong supporter who already backs the campaign',
      leaning: 'someone who is leaning towards supporting but not fully committed',
      undecided: 'an undecided voter who has not made up their mind',
      opposed: 'someone who opposes the campaign or has concerns',
      unknown: 'someone whose views are not yet known',
    };

    const supportTactics = {
      strong_supporter: 'Focus on deepening engagement, volunteering, and getting out the vote. Be warm and treat them as an ally.',
      leaning: 'Reinforce their instinct to support. Address any hesitations. Make them feel their vote matters.',
      undecided: 'Listen more than you talk. Find common ground. Avoid pushing too hard. Focus on local issues.',
      opposed: 'Remain respectful. Acknowledge concerns. Find any shared ground. Aim for a neutral outcome, not conversion.',
      unknown: 'Start open-ended. Gauge views quickly. Adapt tone as you learn more.',
    };

    const interactionSummary = interactions.length > 0
      ? interactions.map(i => `- ${i.type.replace('_', ' ')} on ${i.date}: outcome was ${i.outcome}. Notes: ${i.notes || 'none'}`).join('\n')
      : 'No previous interactions recorded.';

    const issuesSummary = issues.length > 0
      ? issues.map(i => `- ${i.title} (${i.category}): ${i.policy_position || i.description || 'No position recorded'}`).join('\n')
      : 'No specific issues recorded.';

    const keyIssues = contact.key_issues?.length > 0
      ? `This contact has mentioned interest in: ${contact.key_issues.join(', ')}.`
      : '';

    const prompt = `You are an expert political campaign canvassing coach for the UK Green Party. Generate a structured, personable canvassing script for a door-knock conversation.

CONTACT DETAILS:
- Name: ${contact.name}
- Address: ${contact.address || 'Not recorded'}, ${contact.postcode || ''}
- Support Level: ${supportDescriptions[support_level] || 'unknown'}
- Registered Voter: ${contact.registered_voter ? 'Yes' : 'Unknown'}
- Tags: ${contact.tags?.join(', ') || 'None'}
${keyIssues}

PREVIOUS INTERACTIONS:
${interactionSummary}

CURRENT CAMPAIGN ISSUES & POSITIONS:
${issuesSummary}

${feedback ? `ORGANISER FEEDBACK / ADAPTATION NOTES:\n${feedback}` : ''}

STRATEGY GUIDANCE:
${supportTactics[support_level] || supportTactics.unknown}

Generate a complete, realistic canvassing script with:
1. A warm, natural opening line (not robotic)
2. 3-4 specific talking points tied to real campaign issues
3. 3 follow-up questions to ask based on likely responses
4. 2-3 objection handlers for common pushbacks
5. A friendly closing that asks for their support or next step
6. One practical tip for the canvasser

Return ONLY valid JSON in this exact format:
{
  "opening": "string - the opening line to say at the door",
  "talking_points": ["string", "string", "string"],
  "follow_up_questions": ["string", "string", "string"],
  "objection_handlers": [
    {"objection": "string", "response": "string"},
    {"objection": "string", "response": "string"}
  ],
  "closing": "string - how to wrap up the conversation",
  "tone": "string - e.g. 'warm and conversational'",
  "strategy": "string - brief strategy label e.g. 'Voter Mobilisation' or 'Persuasion'",
  "tips": "string - one practical tip for the canvasser"
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          opening: { type: 'string' },
          talking_points: { type: 'array', items: { type: 'string' } },
          follow_up_questions: { type: 'array', items: { type: 'string' } },
          objection_handlers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                objection: { type: 'string' },
                response: { type: 'string' }
              }
            }
          },
          closing: { type: 'string' },
          tone: { type: 'string' },
          strategy: { type: 'string' },
          tips: { type: 'string' },
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});