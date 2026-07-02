/**
 * Geographic utility functions for distance calculations and location handling
 */

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // Distance in meters, rounded
};

/**
 * Format distance for display
 * @param {number} distanceInMeters - Distance in meters
 * @returns {string} Formatted distance string (e.g., "500m" or "2.5 km")
 */
export const formatDistance = (distanceInMeters) => {
  if (distanceInMeters === null || distanceInMeters === undefined) {
    return null;
  }
  
  if (distanceInMeters >= 1000) {
    return `${(distanceInMeters / 1000).toFixed(1)} km`;
  }
  
  return `${distanceInMeters}m`;
};

/**
 * Validate latitude value
 * @param {string|number} lat - Latitude value to validate
 * @returns {number|null} Parsed latitude or null if invalid
 */
export const parseLatitude = (lat) => {
  if (lat === null || lat === undefined || lat === '') {
    return null;
  }
  
  const parsed = parseFloat(lat);
  
  // Latitude must be between -90 and 90
  if (isNaN(parsed) || parsed < -90 || parsed > 90) {
    return null;
  }
  
  return parsed;
};

/**
 * Validate longitude value
 * @param {string|number} lon - Longitude value to validate
 * @returns {number|null} Parsed longitude or null if invalid
 */
export const parseLongitude = (lon) => {
  if (lon === null || lon === undefined || lon === '') {
    return null;
  }
  
  const parsed = parseFloat(lon);
  
  // Longitude must be between -180 and 180
  if (isNaN(parsed) || parsed < -180 || parsed > 180) {
    return null;
  }
  
  return parsed;
};

/**
 * Validate and parse coordinates from URL params or other sources
 * @param {string|number} lat - Latitude value
 * @param {string|number} lon - Longitude value
 * @returns {{ latitude: number, longitude: number } | null} Parsed coordinates or null if invalid
 */
export const parseCoordinates = (lat, lon) => {
  const latitude = parseLatitude(lat);
  const longitude = parseLongitude(lon);
  
  if (latitude === null || longitude === null) {
    return null;
  }
  
  return { latitude, longitude };
};

