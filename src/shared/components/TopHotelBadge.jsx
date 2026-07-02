import React from 'react';
import { Badge } from './badge';
import { useAuth } from '../../features/authentication';

/**
 * TopHotelBadge component to display if a hotel is featured in top three
 * @param {string} hotelId - The ID of the hotel to check
 * @param {string} className - Additional CSS classes
 */
const TopHotelBadge = ({ hotelId, className = "" }) => {
  const { isTopHotel } = useAuth();

  if (!isTopHotel(hotelId)) {
    return null;
  }

  return (
    <Badge 
      variant="secondary" 
      className={`bg-yellow-500 text-white hover:bg-yellow-600 ${className}`}
    >
       Top Listed Lodge
    </Badge>
  );
};

export default TopHotelBadge;
