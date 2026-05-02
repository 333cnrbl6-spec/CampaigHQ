/**
 * Geocoding validation utilities
 * Ensures coordinates are valid and sentinel values are handled correctly
 */

export const isValidCoordinate = (lat, lng) => {
  if (lat === 0 && lng === 0) return false; // Sentinel value
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (lat < -90 || lat > 90) return false; // Latitude bounds
  if (lng < -180 || lng > 180) return false; // Longitude bounds
  return true;
};

export const isGeocodingFailed = (contact) => {
  // Contact failed geocoding if no valid coordinates
  return !isValidCoordinate(contact?.latitude, contact?.longitude);
};

export const getGeocodingStats = (contacts) => {
  if (!Array.isArray(contacts)) return { total: 0, geocoded: 0, failed: 0, percentage: 0 };
  
  const total = contacts.length;
  const geocoded = contacts.filter(c => isValidCoordinate(c?.latitude, c?.longitude)).length;
  const failed = total - geocoded;
  
  return {
    total,
    geocoded,
    failed,
    percentage: total > 0 ? Math.round((geocoded / total) * 100) : 0,
  };
};

/**
 * Validate geocoding result from backend
 */
export const validateGeocodingResult = (result) => {
  if (!result?.data) return { valid: false, error: 'No data in response' };
  if (!result.data.results) return { valid: false, error: 'No results object' };
  if (typeof result.data.results.succeeded !== 'number') {
    return { valid: false, error: 'succeeded count missing or invalid' };
  }
  if (typeof result.data.results.failed !== 'number') {
    return { valid: false, error: 'failed count missing or invalid' };
  }
  
  return { valid: true, message: 'Geocoding result valid' };
};