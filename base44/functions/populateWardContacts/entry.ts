import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TYLDESLEY_POSTCODES = [
  'M29 8AA', 'M29 8AB', 'M29 8AD', 'M29 8AE', 'M29 8AF',
  'M29 8AG', 'M29 8AH', 'M29 8AJ', 'M29 8AL', 'M29 8AN',
  'M29 8AP', 'M29 8AQ', 'M29 8AR', 'M29 8AS', 'M29 8AT',
  'M29 8AU', 'M29 8AW', 'M29 8AX', 'M29 8AY', 'M29 8AZ',
  'M29 8BA', 'M29 8BB', 'M29 8BD', 'M29 8BE', 'M29 8BF',
  'M29 8BG', 'M29 8BH', 'M29 8BJ', 'M29 8BL', 'M29 8BN',
  'M29 8BP', 'M29 8BQ', 'M29 8BR', 'M29 8BS', 'M29 8BT',
  'M29 8BU', 'M29 8BW', 'M29 8BX', 'M29 8BY', 'M29 8BZ',
  'M29 7AA', 'M29 7AB', 'M29 7AD', 'M29 7AE', 'M29 7AF',
  'M29 7AG', 'M29 7AH', 'M29 7AJ', 'M29 7AL', 'M29 7AN'
];

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda',
  'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah',
  'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty',
  'Anthony', 'Margaret', 'Donald', 'Sandra', 'Mark', 'Ashley', 'Paul', 'Kimberly',
  'Steven', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Dorothy',
  'Kevin', 'Carol', 'Brian', 'Ruth', 'George', 'Sharon', 'Timothy', 'Michelle',
  'Ronald', 'Laura', 'Edward', 'Kathleen', 'Jason', 'Amy', 'Jeffrey', 'Angela',
  'Ryan', 'Shirley', 'Jacob', 'Anna', 'Gary', 'Brenda', 'Nicholas', 'Pamela',
  'Eric', 'Emma', 'Jonathan', 'Nicole', 'Stephen', 'Helen', 'Larry', 'Samantha',
  'Scott', 'Katherine', 'Frank', 'Christine', 'Raymond', 'Debra', 'Jack', 'Rachel'
];

const LAST_NAMES = [
  'Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies',
  'Robinson', 'Wright', 'Thompson', 'Evans', 'Walker', 'White', 'Roberts', 'Green',
  'Hall', 'Wood', 'Jackson', 'Clarke', 'Harris', 'Martin', 'Cooper', 'Hill',
  'Ward', 'Morris', 'Moore', 'Clark', 'Lee', 'King', 'Baker', 'Harrison',
  'Morgan', 'Allen', 'James', 'Scott', 'Phillips', 'Watson', 'Davis', 'Parker',
  'Price', 'Bennett', 'Young', 'Griffiths', 'Mitchell', 'Kelly', 'Cook', 'Carter',
  'Richardson', 'Bailey', 'Collins', 'Bell', 'Shaw', 'Murphy', 'Miller', 'Cox',
  'Richards', 'Khan', 'Marshall', 'Anderson', 'Dixon', 'Dyer', 'Holmes', 'Hughes',
  'Gibson', 'Fletcher', 'Barker', 'Mills', 'Pearce', 'Burton', 'Hunt', 'Graham'
];

const SUPPORT_LEVELS = ['strong_supporter', 'leaning', 'undecided', 'opposed', 'unknown'];
const SUPPORT_WEIGHTS = [0.15, 0.20, 0.30, 0.10, 0.25]; // realistic distribution

const KEY_ISSUES = [
  'Local transport', 'Housing costs', 'Environment & climate', 'School funding',
  'NHS waiting times', 'Cost of living', 'Potholes & roads', 'Community safety',
  'Parks & green spaces', 'Air quality', 'Public services cuts', 'Local jobs',
  'Affordable housing', 'Youth services', 'Road safety', 'Flooding risk',
  'Mine subsidence', 'Heritage & conservation'
];

function weightedRandom(items, weights) {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) return items[i];
  }
  return items[items.length - 1];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { campaign_id } = body;

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // Fetch real postcode data from postcodes.io
    const validPostcodes = [];
    const postcodeStreetMap = {};

    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < TYLDESLEY_POSTCODES.length; i += batchSize) {
      batches.push(TYLDESLEY_POSTCODES.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const res = await fetch('https://api.postcodes.io/postcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcodes: batch })
      });
      const data = await res.json();
      if (data.result) {
        for (const item of data.result) {
          if (item.result) {
            validPostcodes.push(item.result.postcode);
            // Use the parish/admin ward as context for street generation
            postcodeStreetMap[item.result.postcode] = {
              parish: item.result.parish || 'Tyldesley',
              ward: item.result.admin_ward || 'Tyldesley & Mosley Common',
              district: item.result.admin_district || 'Wigan'
            };
          }
        }
      }
    }

    // Known real streets in Tyldesley & Mosley Common area
    const realStreets = [
      'Elliott Street', 'Sale Lane', 'Shuttle Street', 'Shakerley Road', 'Minerva Road',
      'George Street', 'Princess Street', 'King Street', 'Queen Street', 'Castle Street',
      'Manchester Road', 'Leigh Road', 'Coal Pit Lane', 'Astley Road', 'Tyldesley Road',
      'Mort Lane', 'Higher Green Lane', 'Lower Green Lane', 'Hindsford Bridge Road', 'Hough Lane',
      'Mosley Common Road', 'Chat Moss Road', 'Boothstown Drive', 'Worsley Road North',
      'Vicars Hall Lane', 'Boothstown Road', 'Bridgewater Road', 'Green Lane', 'School Lane',
      'Church Street', 'Chapel Street', 'Station Road', 'Mill Lane', 'Fold Road',
      'Park Road', 'Victoria Street', 'Albert Street', 'Edward Street', 'John Street',
      'Firs Lane', 'Pennington Lane', 'Hindsford Street', 'Nook Lane', 'Warburton Lane',
      'Tyldesley Old Road', 'Collier Street', 'Duke Street', 'Plank Lane', 'Gin Pit'
    ];

    // Generate contacts per postcode (simulating ~8-15 households per postcode)
    const contacts = [];
    const postcodesPool = validPostcodes.length > 0 ? validPostcodes : TYLDESLEY_POSTCODES;

    // Target: ~600 contacts for realistic ward coverage
    const targetContacts = 600;
    let count = 0;

    while (count < targetContacts) {
      const postcode = pick(postcodesPool);
      const street = pick(realStreets);
      const houseNum = randomInt(1, 150);
      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);

      // 87% registered voters in typical English ward
      const isRegisteredVoter = Math.random() < 0.87;

      // Support level with realistic weighting
      const supportLevel = weightedRandom(SUPPORT_LEVELS, SUPPORT_WEIGHTS);

      // 25% canvassed so far
      const isCanvassed = Math.random() < 0.25;
      const daysAgo = randomInt(1, 120);
      const canvassDate = isCanvassed
        ? new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0]
        : undefined;

      // 4% volunteers
      const isVolunteer = Math.random() < 0.04;

      // 1-3 key issues
      const numIssues = randomInt(1, 3);
      const selectedIssues = [];
      while (selectedIssues.length < numIssues) {
        const issue = pick(KEY_ISSUES);
        if (!selectedIssues.includes(issue)) selectedIssues.push(issue);
      }

      const contact = {
        name: `${firstName} ${lastName}`,
        address: `${houseNum} ${street}`,
        postcode,
        registered_voter: isRegisteredVoter,
        support_level: supportLevel,
        canvassed: isCanvassed,
        key_issues: selectedIssues,
        volunteer: isVolunteer,
      };

      if (canvassDate) contact.canvass_date = canvassDate;

      contacts.push(contact);
      count++;
    }

    // Bulk create in batches of 100 with campaign_id injected
    let created = 0;
    for (let i = 0; i < contacts.length; i += 100) {
      const batch = contacts.slice(i, i + 100).map(c => ({ ...c, campaign_id }));
      await base44.entities.Contact.bulkCreate(batch);
      created += batch.length;
    }

    return Response.json({
      success: true,
      created,
      valid_postcodes_found: validPostcodes.length,
      message: `Created ${created} voter contacts across ${postcodesPool.length} postcodes in Tyldesley & Mosley Common ward`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});