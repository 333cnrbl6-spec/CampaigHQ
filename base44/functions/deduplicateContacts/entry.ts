import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  // Retry only on rate limit (429), not on 404
  const callWithRetry = async (fn) => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const msg = err?.message || '';
        if (msg.includes('not found')) throw err; // don't retry 404s
        if (attempt === 5) throw err;
        await delay(attempt * 1000);
      }
    }
  };

  // Fetch all contacts (up to 10k)
  const contacts = await base44.asServiceRole.entities.Contact.list('name', 10000);

  // Group by normalised address
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

  for (const group of duplicateGroups) {
    // Prefer records with more data (postcode weighted higher)
    group.sort((a, b) => {
      const score = x => (x.phone ? 1 : 0) + (x.email ? 1 : 0) + (x.notes ? 1 : 0) + (x.postcode ? 2 : 0);
      return score(b) - score(a);
    });

    const [keep, ...dupes] = group;

    const allTags = [...new Set([
      ...(keep.tags || []),
      ...dupes.flatMap(d => d.tags || []),
    ])];

    const mergedData = {
      tags: allTags,
      phone: keep.phone || dupes.find(d => d.phone)?.phone,
      email: keep.email || dupes.find(d => d.email)?.email,
      notes: [keep.notes, ...dupes.map(d => d.notes)].filter(Boolean).join(' | ') || undefined,
      registered_voter: keep.registered_voter || dupes.some(d => d.registered_voter),
      volunteer: keep.volunteer || dupes.some(d => d.volunteer),
      postcode: [keep, ...dupes].map(d => d.postcode).filter(Boolean).sort((a, b) => b.length - a.length)[0] || undefined,
    };

    try {
      await callWithRetry(() => base44.asServiceRole.entities.Contact.update(keep.id, mergedData));
      merged++;
    } catch (err) {
      if (!err?.message?.includes('not found')) throw err;
      // Keeper already deleted — skip group
    }

    for (const dupe of dupes) {
      try {
        await callWithRetry(() => base44.asServiceRole.entities.Contact.delete(dupe.id));
        deleted++;
      } catch (err) {
        if (!err?.message?.includes('not found')) throw err;
        // Already deleted — skip silently
      }
    }
  }

  return Response.json({
    groups: duplicateGroups.length,
    merged,
    deleted,
  });
});