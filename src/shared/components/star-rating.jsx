import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating, size = 16, showRating = false, className = "" }) => {
  // Ensure rating is a number and clamp between 0 and 5
  const numericRating = Math.max(0, Math.min(5, Number(rating) || 0));
  
  const renderStar = (starNumber) => {
    const fillPercentage = Math.max(0, Math.min(1, numericRating - (starNumber - 1)));
    
    if (fillPercentage === 0) {
      // Empty star
      return (
        <Star
          key={starNumber}
          size={size}
          className="text-gray-300 transition-colors"
        />
      );
    } else if (fillPercentage === 1) {
      // Full star
      return (
        <Star
          key={starNumber}
          size={size}
          className="fill-yellow-400 text-yellow-400 transition-colors"
        />
      );
    } else {
      // Partial star - create a gradient effect
      return (
        <div key={starNumber} className="relative">
          {/* Background star (empty) */}
          <Star
            size={size}
            className="text-gray-300 transition-colors"
          />
          {/* Foreground star (filled) with clip-path */}
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{
              width: `${fillPercentage * 100}%`,
            }}
          >
            <Star
              size={size}
              className="fill-yellow-400 text-yellow-400 transition-colors"
            />
          </div>
        </div>
      );
    }
  };
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => renderStar(star))}
      {showRating && numericRating > 0 && (
        <span className="text-xs sm:text-sm font-medium text-gray-700 ml-1">
          {numericRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating; 