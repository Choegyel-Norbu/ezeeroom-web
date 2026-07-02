import React, { useState, useEffect, useRef } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Textarea } from '@/shared/components/textarea';
import { toast } from 'sonner';
import api from "../../shared/services/Api";

// Simple className utility function
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

const HotelReviewSheet = ({
  isOpen,
  userId,
  hotelId,
  onSubmitSuccess,
  onClose
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const sheetRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setRating(0);
      setComment('');
      setErrors({});
      setHoveredRating(0);
    }
  }, [isOpen]);

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target)) {
        // Check if the click is on the backdrop (not on the sheet itself)
        if (event.target.classList.contains('backdrop')) {
          onClose?.(); // Close the sheet without success callback
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const validateForm = () => {
    const newErrors = {};
    
    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (comment.length > 1000) {
      newErrors.comment = 'Comment must be less than 1000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const reviewData = {
        rating,
        comment: comment.trim() || undefined,
        hotelId,
        userId
      };

      const response = await api.post(`/reviews`, reviewData);

      if (response.status === 200 || response.status === 201) {
        // Success - show appreciation message and call the parent callback
        toast.success('Thank you for your review!', {
          duration: 10000,
          description: 'Your feedback helps other travelers make informed decisions. We appreciate you taking the time to share your experience.'
        });
        onSubmitSuccess();
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (error) {

      // Extract message from plain text response
      let errorMessage = 'Failed to submit review. Please try again.';
      
      if (error.response && error.response.data) {
        // If response.data is a string (plain text), use it directly
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          // If it's JSON with a message property
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        // Fallback to error.message
        errorMessage = error.message;
      }
      
      // Use the backend response message directly
      toast.error(errorMessage, {
        duration: 5000,
        description: errorMessage.includes('already reviewed') 
          ? 'Each user can only submit one review per hotel. If you need to update your review, please contact our support team.'
          : 'Please try again or contact support if the issue persists.'
      });
      
      // Set form error for display
      setErrors({ rating: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = () => {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHoveredRating(value)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
            aria-label={`Rate ${value} stars`}
          >
            <Star
              size={28}
              className={cn(
                "transition-colors sm:w-8 sm:h-8",
                (hoveredRating || rating) >= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-[#050203]/50 transition-all duration-500 ease-in-out z-40 backdrop",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 bg-white rounded-t-3xl shadow-2xl z-50",
          "transform transition-all duration-500 ease-out",
          "max-h-[85vh] sm:max-h-[90vh] overflow-auto",
          "w-full sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:w-[90%] md:w-[70%] lg:w-[60%]",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        <div className="p-4 sm:p-6 pb-6 sm:pb-8 mx-auto">
          {/* Drag Handle */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:mb-6 transition-all duration-300 ease-out" />
          
          {/* Header with Close Button */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 animate-in slide-in-from-top-2 duration-500">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Rate your stay
            </h2>
          </div>
          
          {/* Rating Section */}
          <div className="mb-4 sm:mb-6 animate-in slide-in-from-bottom-2 duration-500 delay-100">
            <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              How was your experience?
            </label>
            <StarRating />
            {errors.rating && (
              <p className="mt-2 text-sm text-red-600 animate-in slide-in-from-top-1 duration-300">{errors.rating}</p>
            )}
          </div>
          
          {/* Comment Section */}
          <div className="mb-4 sm:mb-6 animate-in slide-in-from-bottom-2 duration-500 delay-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your thoughts (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your stay..."
              className="min-h-[100px] sm:min-h-[120px] resize-none transition-all duration-200 ease-out focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2">
              <p className={cn(
                "text-xs sm:text-sm transition-colors duration-200",
                comment.length > 1000 ? "text-red-600" : "text-gray-500"
              )}>
                {comment.length}/1000 characters
              </p>
              {errors.comment && (
                <p className="text-xs sm:text-sm text-red-600 animate-in slide-in-from-top-1 duration-300">{errors.comment}</p>
              )}
            </div>
          </div>
          
          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium animate-in slide-in-from-bottom-2 duration-500 delay-300 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-sm sm:text-base">Submitting...</span>
              </div>
            ) : (
              'Submit Review'
            )}
          </Button>
          
          {/* Info Text */}
          <p className="text-xs text-gray-500 text-center mt-3 sm:mt-4 animate-in slide-in-from-bottom-2 duration-500 delay-400 leading-relaxed">
            Top review will be posted publicly after verification under the hotel name
          </p>
        </div>
      </div>
    </>
  );
};

export default HotelReviewSheet;