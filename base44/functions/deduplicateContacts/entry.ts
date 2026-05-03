import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { campaign_id } = body;

  if (!campaign_id) {
    return Response.json({ error: 'campaign_id is required' }, { status: 400 });
  }

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  // Retry with exponential backoff, specifically handles 429 rate limits
  const callWithRetry = async (fn) => {
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const msg = err?.message || '';
        if (msg.includes('not found')) throw err; // don't retry 404s
        if (msg.includes('Rate limit') || msg.includes('429')) {
          // Exponential backoff: 2s, 4s, 8s, 16s, 32s
          const wait = Math.min(2000 * Math.pow(2, attempt - 1), 32000);
          await delay(wait);
          continue;
        }
        if (attempt === 6) throw err;
        await delay(attempt * 500);
      }
    }
  };

  // Run tasks with limited concurrency to avoid rate limits
  const runWithConcurrency = async (tasks, concurrency = 2) => {
    const results = [];
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(batch.map(t => t()));
      results.push(...batchResults);
      // Small pause between batches to stay under rate limits
      if (i + concurrency < tasks.length) {
        await delay(300);
      }
    }
    return results;
  };

  // Fetch contacts for this campaign only
  const contacts = await base44.asServiceRole.entities.Contact.filter({ campaign_id }, 'name', 10000);

  // Group by normalised address + name to find true duplicates
  const groups = {};
  for (const c of contacts) {
    const key = (c.address || c.name || '').toLowerCase().trim();
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }

  const duplicateGroups = Object.values(groups).filter(g => g.length > 1);
  let merged = 0;
  let deleted = 0;

  // Collect all operations and batch them to avoid rate limits
  const updateTasks = [];
  const deleteIds = [];

  for (const group of duplicateGroups) {
    // Prefer records with more data (postcode weighted higher)
    group.sort((a, b) => {
      const score = x => (x.phone ? 1 : 0) + (x.email ? 1 : 0) + (x.notes ? 1 : 0) + (x.postcode ? 2 : 0);
      return score(b) - score(a);
    });

    const [keep, ...dupes] = group;

    const mergedData = {
      tags: [...new Set([...(keep.tags || []), ...dupes.flatMap(d => d.tags || [])])],
      phone: keep.phone || dupes.find(d => d.phone)?.phone,
      email: keep.email || dupes.find(d => d.email)?.email,
      notes: [keep.notes, ...dupes.map(d => d.notes)].filter(Boolean).join(' | ') || undefined,
      registered_voter: keep.registered_voter || dupes.some(d => d.registered_voter),
      volunteer: keep.volunteer || dupes.some(d => d.volunteer),
      postcode: [keep, ...dupes].map(d => d.postcode).filter(Boolean).sort((a, b) => b.length - a.length)[0] || undefined,
    };

    updateTasks.push(async () => {
      try {
        await callWithRetry(() => base44.asServiceRole.entities.Contact.update(keep.id, mergedData));
        merged++;
      } catch (err) {
        if (!err?.message?.includes('not found')) throw err;
      }
    });

    deleteIds.push(...dupes.map(d => d.id));
  }

  // Run updates with low concurrency
  await runWithConcurrency(updateTasks, 1);

  // Batch delete remaining duplicates
  for (let i = 0; i < deleteIds.length; i++) {
    try {
      await callWithRetry(() => base44.asServiceRole.entities.Contact.delete(deleteIds[i]));
      deleted++;
    } catch (err) {
      if (!err?.message?.includes('not found')) throw err;
    }
    // Pause between deletes to respect rate limits
    if (i < deleteIds.length - 1) await delay(100);
  }

  return Response.json({
    groups: duplicateGroups.length,
    merged,
    deleted,
  });
});