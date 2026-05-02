/**
 * Testing utilities for campaign app
 * Run tests via: npm test or test_backend_function
 */

export const testSuites = {
  campaignContext: 'Campaign initialization and auto-load',
  contactsCRUD: 'Contact create/read/update/delete operations',
  geocoding: 'Address geocoding pipeline validation',
  fieldMode: 'GPS tracking and offline sync',
  leaderboard: 'Volunteer ranking calculations',
  permissions: 'Role-based access control',
};

/**
 * Campaign Context Test
 */
export const testCampaignContext = async (base44) => {
  console.log('[TEST] Campaign Context — initialization');
  try {
    const user = await base44.auth.me();
    const campaigns = await base44.entities.Campaign.list('name', 1000);
    
    if (!user?.email) throw new Error('User not authenticated');
    if (!Array.isArray(campaigns)) throw new Error('Campaigns not an array');
    
    return { passed: true, message: 'Campaign context loads correctly' };
  } catch (err) {
    return { passed: false, message: `Campaign context error: ${err.message}` };
  }
};

/**
 * Contacts CRUD Test
 */
export const testContactsCRUD = async (base44, campaignId) => {
  console.log('[TEST] Contacts CRUD');
  if (!campaignId) return { passed: false, message: 'campaignId required' };
  
  try {
    // CREATE
    const created = await base44.entities.Contact.create({
      campaign_id: campaignId,
      name: 'Test Contact',
      address: '123 Test St',
      postcode: 'M1 1AA',
      registered_voter: true,
    });
    if (!created?.id) throw new Error('Create failed');
    
    // READ
    const fetched = await base44.entities.Contact.get(created.id);
    if (fetched.name !== 'Test Contact') throw new Error('Read failed');
    
    // UPDATE
    await base44.entities.Contact.update(created.id, { support_level: 'strong_supporter' });
    
    // VERIFY UPDATE
    const updated = await base44.entities.Contact.get(created.id);
    if (updated.support_level !== 'strong_supporter') throw new Error('Update failed');
    
    // DELETE
    await base44.entities.Contact.delete(created.id);
    
    return { passed: true, message: 'All CRUD operations successful' };
  } catch (err) {
    return { passed: false, message: `CRUD test failed: ${err.message}` };
  }
};

/**
 * Geocoding Pipeline Test
 */
export const testGeocodingPipeline = async (base44, campaignId) => {
  console.log('[TEST] Geocoding Pipeline');
  if (!campaignId) return { passed: false, message: 'campaignId required' };
  
  try {
    // Create test contacts with UK postcodes
    const testContacts = [
      { campaign_id: campaignId, name: 'Test 1', postcode: 'M1 1AA' },
      { campaign_id: campaignId, name: 'Test 2', postcode: 'SW1A 1AA' },
    ];
    
    const created = await Promise.all(
      testContacts.map(c => base44.entities.Contact.create(c))
    );
    
    // Run geocoding
    const result = await base44.functions.invoke('batchGeocodeContacts', { campaign_id: campaignId });
    
    // Verify results
    if (!result.data?.results?.succeeded >= 0) throw new Error('Geocoding response invalid');
    
    // Cleanup
    await Promise.all(created.map(c => base44.entities.Contact.delete(c.id)));
    
    return { 
      passed: true, 
      message: `Geocoding pipeline: ${result.data.results.succeeded} succeeded, ${result.data.results.failed} failed`
    };
  } catch (err) {
    return { passed: false, message: `Geocoding test failed: ${err.message}` };
  }
};

/**
 * Field Mode GPS Test
 */
export const testFieldModeGPS = async (base44, campaignId, volunteerEmail) => {
  console.log('[TEST] Field Mode GPS Tracking');
  if (!campaignId || !volunteerEmail) return { passed: false, message: 'campaignId and volunteerEmail required' };
  
  try {
    // Simulate location update
    const result = await base44.functions.invoke('updateVolunteerLocation', {
      campaign_id: campaignId,
      volunteer_email: volunteerEmail,
      latitude: 53.4808,
      longitude: -2.2426,
      postcode: 'M1 1AA',
    });
    
    if (!result.data) throw new Error('Location update failed');
    
    return { passed: true, message: 'GPS tracking location updated' };
  } catch (err) {
    return { passed: false, message: `Field Mode GPS test failed: ${err.message}` };
  }
};

/**
 * Leaderboard Calculation Test
 */
export const testLeaderboardCalc = async (base44, campaignId) => {
  console.log('[TEST] Leaderboard Calculations');
  if (!campaignId) return { passed: false, message: 'campaignId required' };
  
  try {
    const leaderboard = await base44.functions.invoke('getLeaderboardData', {
      campaign_id: campaignId,
    });
    
    if (!Array.isArray(leaderboard.data)) throw new Error('Leaderboard not an array');
    
    // Verify rankings are numeric and descending
    for (let i = 1; i < leaderboard.data.length; i++) {
      const prev = leaderboard.data[i - 1]?.doors_knocked || 0;
      const curr = leaderboard.data[i]?.doors_knocked || 0;
      if (prev < curr) throw new Error('Rankings not in descending order');
    }
    
    return { passed: true, message: `Leaderboard: ${leaderboard.data.length} volunteers ranked` };
  } catch (err) {
    return { passed: false, message: `Leaderboard test failed: ${err.message}` };
  }
};

/**
 * Run all tests
 */
export const runAllTests = async (base44, campaignId, volunteerEmail) => {
  console.log('=== Running Full Test Suite ===');
  
  const results = [];
  results.push(await testCampaignContext(base44));
  results.push(await testContactsCRUD(base44, campaignId));
  results.push(await testGeocodingPipeline(base44, campaignId));
  results.push(await testFieldModeGPS(base44, campaignId, volunteerEmail));
  results.push(await testLeaderboardCalc(base44, campaignId));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n=== Test Results: ${passed}/${total} passed ===`);
  results.forEach(r => {
    console.log(`${r.passed ? '✓' : '✗'} ${r.message}`);
  });
  
  return { passed, total, results };
};