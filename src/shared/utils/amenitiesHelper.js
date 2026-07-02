import amenitiesData from '../constants/amenities.json';

/**
 * Get all amenities for a specific listing type
 * @param {string} listingType - The type of listing (hotel, restaurant, etc.)
 * @returns {Array} - Array of all amenities for the listing type
 */
export const getAmenitiesForType = (listingType) => {
  if (!listingType || !amenitiesData[listingType]) return [];
  
  // Flatten all categories into a single array
  const allAmenities = [];
  Object.values(amenitiesData[listingType]).forEach(category => {
    allAmenities.push(...category);
  });
  
  return allAmenities;
};

/**
 * Get categorized amenities for a specific listing type
 * @param {string} listingType - The type of listing (hotel, restaurant, etc.)
 * @returns {Object} - Object with categories and their amenities
 */
export const getCategorizedAmenities = (listingType) => {
  if (!listingType || !amenitiesData[listingType]) return {};
  
  return amenitiesData[listingType];
};

/**
 * Get amenities by category for a specific listing type
 * @param {string} listingType - The type of listing
 * @param {string} category - The category of amenities
 * @returns {Array} - Array of amenities for the specific category
 */
export const getAmenitiesByCategory = (listingType, category) => {
  if (!listingType || !amenitiesData[listingType] || !amenitiesData[listingType][category]) {
    return [];
  }
  
  return amenitiesData[listingType][category];
};

/**
 * Get all available listing types
 * @returns {Array} - Array of available listing types
 */
export const getAvailableListingTypes = () => {
  return Object.keys(amenitiesData);
};

/**
 * Get all available categories for a listing type
 * @param {string} listingType - The type of listing
 * @returns {Array} - Array of available categories
 */
export const getAvailableCategories = (listingType) => {
  if (!listingType || !amenitiesData[listingType]) return [];
  
  return Object.keys(amenitiesData[listingType]);
};

/**
 * Search amenities by keyword
 * @param {string} listingType - The type of listing
 * @param {string} keyword - The search keyword
 * @returns {Array} - Array of matching amenities
 */
export const searchAmenities = (listingType, keyword) => {
  const allAmenities = getAmenitiesForType(listingType);
  
  if (!keyword) return allAmenities;
  
  return allAmenities.filter(amenity => 
    amenity.toLowerCase().includes(keyword.toLowerCase())
  );
};

/**
 * Get amenities count for a listing type
 * @param {string} listingType - The type of listing
 * @returns {number} - Total number of amenities
 */
export const getAmenitiesCount = (listingType) => {
  return getAmenitiesForType(listingType).length;
};

/**
 * Get amenities count by category
 * @param {string} listingType - The type of listing
 * @returns {Object} - Object with category names and their counts
 */
export const getAmenitiesCountByCategory = (listingType) => {
  const categorized = getCategorizedAmenities(listingType);
  const counts = {};
  
  Object.keys(categorized).forEach(category => {
    counts[category] = categorized[category].length;
  });
  
  return counts;
}; 