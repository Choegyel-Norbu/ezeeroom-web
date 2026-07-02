/**
 * Constants for nearby hotel search functionality
 */

/**
 * Default search radius in kilometers
 */
export const DEFAULT_NEARBY_RADIUS = "0.5";

/**
 * Available radius options for nearby search
 * value: string (km) - used in URL params and API calls
 * label: string - displayed in UI
 */
export const NEARBY_RADIUS_OPTIONS = [
  { value: "0.5", label: "0.5 km" },
  { value: "1", label: "1 km" },
  { value: "2", label: "2 km" },
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
];

/**
 * Get the next larger radius option
 * @param {string} currentRadius - Current radius value
 * @returns {string|null} Next larger radius value or null if already at max
 */
export const getNextLargerRadius = (currentRadius) => {
  const currentIndex = NEARBY_RADIUS_OPTIONS.findIndex(
    (option) => option.value === currentRadius
  );
  
  if (currentIndex === -1 || currentIndex >= NEARBY_RADIUS_OPTIONS.length - 1) {
    return null;
  }
  
  return NEARBY_RADIUS_OPTIONS[currentIndex + 1].value;
};

/**
 * Get the label for a radius value
 * @param {string} radius - Radius value
 * @returns {string} Label for display
 */
export const getRadiusLabel = (radius) => {
  const option = NEARBY_RADIUS_OPTIONS.find((opt) => opt.value === radius);
  return option ? option.label : `${radius} km`;
};

