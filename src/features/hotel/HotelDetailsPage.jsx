import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import RoomBookingCard from "../../features/booking/RoomBookingCard";
import Footer from "../../layouts/Footer";
import SimpleSpinner from "@/shared/components/SimpleSpinner";
import StarRating from "@/shared/components/star-rating";
import HotelMap from "@/shared/components/HotelMap";
import api from "../../shared/services/Api";

import {
  ArrowLeft,
  Share2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Star,
  StarHalf,
  Home,
  Building2,
  Wifi,
  Car,
  Coffee,
  Utensils,
  Bath,
  AirVent,
  Phone,
  X,
  Clock,
  MoreVertical,
  Trash2,
  Facebook,
  Instagram,
  Menu,
  Tv,
  Dumbbell,
  Waves,
  TreePine,
  Shield,
  Key,
  Bed,
  Sofa,
  Gamepad2,
  Music,
  Briefcase,
  Plane,
  Bike,
  ShoppingBag,
  Heart,
  Sparkles,
  Flame,
  Snowflake,
  Sun,
  Moon,
  Cloud,
  Droplets,
  Wind,
  MapPin,
  Globe,
} from "lucide-react";
import { Spinner } from "@/components/ui/ios-spinner";

import { Button } from "@/shared/components/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/card";
import { Badge } from "@/shared/components/badge";
import { Separator } from "@/shared/components/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/components/pagination";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/dropdown-menu";
import { useAuth } from "../authentication";
import { AvatarCircles } from "@/components/ui/avatar-circles";

// Utility function to format time from 24-hour to 12-hour format with descriptive text
const formatTimeWithDescription = (timeString) => {
  if (!timeString) return "Not specified";
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    let description = '';
    if (hours === 0) {
      description = '(Midnight)';
    } else if (hours >= 1 && hours < 6) {
      description = '(Early Morning)';
    } else if (hours >= 6 && hours < 12) {
      description = '(Morning)';
    } else if (hours === 12) {
      description = '(Noon)';
    } else if (hours >= 13 && hours < 17) {
      description = '(Afternoon)';
    } else if (hours >= 17 && hours < 21) {
      description = '(Evening)';
    } else {
      description = '(Night)';
    }
    
    return `${hour12}:${formattedMinutes} ${ampm} ${description}`;
  } catch (error) {
    
    return "Invalid time";
  }
};

// Simple time formatter for sidebar (without description)
const formatTime = (timeString) => {
  if (!timeString) return "Not specified";
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    return `${hour12}:${formattedMinutes} ${ampm}`;
  } catch (error) {
    
    return "Invalid time";
  }
};

// Custom TikTok icon component
const TikTokIcon = ({ className = "h-4 w-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Room Image Carousel Component
const RoomImageCarousel = ({ images, roomNumber, roomType, isActive }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  // Auto-advance images every 5 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      nextImage();
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  // Keyboard navigation - only when carousel is focused
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle keyboard events if user is typing in form inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
      }
      
      if (images.length <= 1) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextImage();
          break;
        case ' ':
          e.preventDefault();
          setShowImageModal(true);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [images.length]);

  if (!images || images.length === 0) {
    return (
      <div className="h-64 w-full bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-64 w-full overflow-hidden group">
        {/* Main Image */}
        <img
          key={currentImageIndex}
          src={images[currentImageIndex]}
          alt={`${roomType} - Room ${roomNumber}`}
          className={`h-full w-full object-cover cursor-pointer transition-all duration-500 ease-in-out hover:scale-105 ${
            imageLoading ? 'blur-sm' : 'blur-0'
          }`}
          onClick={() => setShowImageModal(true)}
          onLoad={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
        />

        {/* Loading Overlay */}
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Spinner size="md" />
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Navigation Arrows - Only show if multiple images */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 hover:bg-background/80 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 hover:bg-background/80 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                  currentImageIndex === index
                    ? "bg-white scale-125 shadow-lg ring-2 ring-white/50"
                    : "bg-white/50 hover:bg-white/75 hover:scale-110"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}

        {/* Status Badge */}
        <Badge
          variant="default"
          className={`absolute left-3 top-3 shadow-lg ${
            isActive 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          <CheckCircle className="mr-1 h-3.5 w-3.5" />
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Image Modal */}
      <Sheet open={showImageModal} onOpenChange={setShowImageModal}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>{roomType} - Room {roomNumber}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 relative h-full">
            <img
              src={images[currentImageIndex]}
              alt={`${roomType} - Room ${roomNumber}`}
              className="h-full w-full object-contain"
            />
            {images.length > 1 && (
              <>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        currentImageIndex === index
                          ? "bg-primary scale-125"
                          : "bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={prevImage}
                    className="rounded-full bg-background/60 hover:bg-background/80 h-10 w-10"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={nextImage}
                    className="rounded-full bg-background/60 hover:bg-background/80 h-10 w-10"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

const HotelDetailsPage = () => {
  const { userId, isAuthenticated, roles, hasRole, hotelId, hotelIds, selectedHotelId } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Combined state for better performance
  const [appState, setAppState] = useState({
    hotel: null,
    loading: true,
    error: null,
    dataLoaded: false, // Track if initial data is loaded
    criticalDataLoaded: false, // Track if critical hotel data is loaded
  });
  
  const [uiState, setUiState] = useState({
    currentImageIndex: 0,
    isFavorite: false,
    showImageModal: false,
    reviewSheetOpen: false,
    isDescriptionExpanded: false,
    mobileMenuOpen: false,
    showHotelNameInNavbar: false,
  });

  // Separate state for room image modal to avoid conflicts
  const [roomImageModal, setRoomImageModal] = useState({
    isOpen: false,
    selectedImage: null,
  });

  // Rooms state
  const [roomsState, setRoomsState] = useState({
    availableRooms: [],
    paginationData: null,
    currentPage: 0,
    loading: false,
  });

  // Testimonials state
  const [testimonialsState, setTestimonialsState] = useState({
    testimonials: [],
    loading: false,
    error: null,
    pagination: null,
    currentPage: 0,
  });

  // Store initial avatars - only set once and don't update when more reviews load
  const initialAvatarsRef = useRef(null);
  const initialPaginationRef = useRef(null);

  // Extract unique reviewer avatars for AvatarCircles component
  const reviewerAvatars = useMemo(() => {
    if (!testimonialsState.testimonials || testimonialsState.testimonials.length === 0) {
      return { avatarUrls: [], totalCount: 0, pageSize: 3, hasMore: false };
    }

    // Only set initial avatars once - don't update when more reviews are loaded
    if (!initialAvatarsRef.current && testimonialsState.pagination) {
      const uniqueAvatars = [];
      const seenUrls = new Set();
      
      testimonialsState.testimonials.forEach((testimonial) => {
        const profilePic = testimonial.userProfilePicUrl;
        if (profilePic && profilePic.trim() && !seenUrls.has(profilePic)) {
          seenUrls.add(profilePic);
          uniqueAvatars.push(profilePic);
        }
      });

      // Limit to 3 visible avatars
      const maxVisible = 3;
      const visibleAvatars = uniqueAvatars.slice(0, maxVisible);
      
      initialAvatarsRef.current = visibleAvatars;
      initialPaginationRef.current = testimonialsState.pagination;
    }

    // Use stored initial avatars if available, otherwise calculate from current testimonials
    const avatarUrls = initialAvatarsRef.current || (() => {
      const uniqueAvatars = [];
      const seenUrls = new Set();
      
      testimonialsState.testimonials.forEach((testimonial) => {
        const profilePic = testimonial.userProfilePicUrl;
        if (profilePic && profilePic.trim() && !seenUrls.has(profilePic)) {
          seenUrls.add(profilePic);
          uniqueAvatars.push(profilePic);
        }
      });
      return uniqueAvatars.slice(0, 3);
    })();

    // Get pagination info (use initial if available, otherwise current)
    const pagination = initialPaginationRef.current || testimonialsState.pagination;
    const pageSize = pagination?.page?.size || 3;
    const totalElements = pagination?.page?.totalElements || testimonialsState.testimonials.length;
    
    // Check if there are more reviews (totalElements > pageSize means there are more pages)
    const hasMore = totalElements > pageSize;

    return {
      avatarUrls: avatarUrls,
      totalCount: totalElements,
      pageSize: pageSize,
      hasMore: hasMore,
    };
  }, [testimonialsState.testimonials, testimonialsState.pagination]);

  // Refs
  const roomsSectionRef = useRef(null);
  const isInitialLoad = useRef(true);
  const abortControllerRef = useRef(null);
  const hasInitialDataLoaded = useRef(false);
  const hotelNameSectionRef = useRef(null);

  // Helper function to check if current user owns this hotel
  const isHotelOwner = useCallback(() => {
    // Only hotel admins can own hotels
    if (!hasRole('HOTEL_ADMIN')) {
      return false;
    }
    
    // Check if the hotel being viewed is in the user's hotelIds array
    if (!id || !hotelIds || !Array.isArray(hotelIds) || hotelIds.length === 0) {
      return false;
    }
    
    // Check if any of the user's hotel IDs match the hotel being viewed
    return hotelIds.some(userHotelId => 
      userHotelId && userHotelId.toString() === id.toString()
    );
  }, [hasRole, hotelIds, id]);

  // Optimized data fetching with single API call for initial load
  const fetchInitialData = useCallback(async () => {
    if (!id || hasInitialDataLoaded.current) return;

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setAppState(prev => ({ ...prev, loading: true, error: null }));
      setRoomsState(prev => ({ ...prev, loading: true }));
      setTestimonialsState(prev => ({ ...prev, loading: true, error: null }));

      // Fetch hotel data first (critical for page to function)
      const hotelResponse = await api.get(`/hotels/details/${id}`, { 
        signal: abortControllerRef.current.signal 
      });
      
      // Update hotel state immediately once we have the critical data
      setAppState(prev => ({
        ...prev,
        hotel: hotelResponse.data,
        criticalDataLoaded: true,
      }));
      
      // Mark that we've loaded initial data to prevent re-fetching
      hasInitialDataLoaded.current = true;

      // Fetch secondary data in parallel (rooms and testimonials)
      // These can fail without breaking the page
      const [roomsResult, testimonialsResult] = await Promise.allSettled([
        api.get(`/rooms/available/${id}?page=0&size=3`, { signal: abortControllerRef.current.signal }),
        api.get(`/reviews/hotel/${id}/testimonials/paginated?page=0&size=3`, { signal: abortControllerRef.current.signal })
      ]);

      // Handle rooms data
      if (roomsResult.status === 'fulfilled') {
        setRoomsState(prev => ({
          ...prev,
          availableRooms: roomsResult.value.data.content || [],
          paginationData: roomsResult.value.data,
          loading: false,
        }));
      } else {
        
        setRoomsState(prev => ({ ...prev, loading: false }));
      }

      // Handle testimonials data
      if (testimonialsResult.status === 'fulfilled') {
        setTestimonialsState(prev => ({
          ...prev,
          testimonials: testimonialsResult.value.data.content || [],
          pagination: testimonialsResult.value.data,
          loading: false,
        }));
      } else {
        
        setTestimonialsState(prev => ({ 
          ...prev, 
          loading: false, 
          error: "Failed to load reviews" 
        }));
      }
      // Set loading to false only after all data fetching attempts are complete
      setAppState(prev => ({
        ...prev,
        loading: false,
        dataLoaded: true,
      }));

    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Ignore aborted requests
      }

      // Only set hotel error when hotel details specifically fail
      setAppState(prev => ({
        ...prev,
        error: "Failed to load hotel details",
        loading: false,
      }));
      setRoomsState(prev => ({ ...prev, loading: false }));
      setTestimonialsState(prev => ({ ...prev, loading: false }));
    }
  }, [id]);

  // Separate function for rooms pagination
  const fetchRooms = useCallback(async (page) => {
    if (!id) return;

    try {
      setRoomsState(prev => ({ ...prev, loading: true }));
      const response = await api.get(`/rooms/available/${id}?page=${page}&size=3`);
      
      setRoomsState(prev => ({
        ...prev,
        availableRooms: response.data.content || [],
        paginationData: response.data,
        currentPage: page,
        loading: false,
      }));
    } catch (err) {
      
      setRoomsState(prev => ({ ...prev, loading: false }));
    }
  }, [id]);

  // Separate function for testimonials pagination
  const fetchTestimonials = useCallback(async (page) => {
    if (!id) return;

    try {
      setTestimonialsState(prev => ({ ...prev, loading: true, error: null }));
      const response = await api.get(`/reviews/hotel/${id}/testimonials/paginated?page=${page}&size=3`);
      
      setTestimonialsState(prev => {
        // If page is 0, replace testimonials (initial load)
        // If page > 0, append new testimonials (load more)
        const newTestimonials = page === 0 
          ? (response.data.content || [])
          : [...prev.testimonials, ...(response.data.content || [])];
        
        return {
          ...prev,
          testimonials: newTestimonials,
          pagination: response.data,
          currentPage: page,
          loading: false,
        };
      });
    } catch (err) {
      
      setTestimonialsState(prev => ({
        ...prev,
        error: "Failed to load testimonials",
        loading: false,
      }));
    }
  }, [id]);

  // Reset state when hotel ID changes
  useEffect(() => {
    hasInitialDataLoaded.current = false;
    setAppState({
      hotel: null,
      loading: true,
      error: null,
      dataLoaded: false,
      criticalDataLoaded: false,
    });
    setRoomsState({
      availableRooms: [],
      paginationData: null,
      currentPage: 0,
      loading: false,
    });
    setTestimonialsState({
      testimonials: [],
      loading: false,
      error: null,
      pagination: null,
      currentPage: 0,
    });
  }, [id]);

  // Initial data load effect
  useEffect(() => {
    fetchInitialData();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchInitialData]);

  // Room pagination effect - track page changes after initial load
  const [hasNavigatedFromInitialPage, setHasNavigatedFromInitialPage] = useState(false);
  
  useEffect(() => {
    if (appState.criticalDataLoaded && hasNavigatedFromInitialPage) {
      fetchRooms(roomsState.currentPage);
    }
  }, [roomsState.currentPage, fetchRooms, appState.criticalDataLoaded, hasNavigatedFromInitialPage]);

  // Testimonials pagination effect - only when page changes, not on initial load
  useEffect(() => {
    if (appState.criticalDataLoaded && testimonialsState.currentPage > 0) {
      fetchTestimonials(testimonialsState.currentPage);
    }
  }, [testimonialsState.currentPage, fetchTestimonials, appState.criticalDataLoaded]);

  // Scroll effect for rooms - Disabled
  // useEffect(() => {
  //   if (isInitialLoad.current) {
  //     isInitialLoad.current = false;
  //   } else if (roomsState.availableRooms.length > 0) {
  //     roomsSectionRef.current?.scrollIntoView({
  //       behavior: "smooth",
  //       block: "start",
  //     });
  //   }
  // }, [roomsState.availableRooms]);

  // Scroll detection for showing hotel name in navbar
  useEffect(() => {
    const handleScroll = () => {
      if (!hotelNameSectionRef.current) return;
      
      const rect = hotelNameSectionRef.current.getBoundingClientRect();
      const scrollThreshold = 100; // Show hotel name when scrolled past 100px from top
      
      // Show hotel name in navbar when hotel name section is scrolled past
      const shouldShow = rect.bottom < scrollThreshold;
      
      setUiState(prev => {
        if (prev.showHotelNameInNavbar !== shouldShow) {
          return { ...prev, showHotelNameInNavbar: shouldShow };
        }
        return prev;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial state
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [appState.hotel]);

  // Memoized UI handlers
  const nextImage = useCallback(() => {
    if (appState.hotel?.photoUrls?.length) {
      setUiState(prev => ({
        ...prev,
        currentImageIndex: prev.currentImageIndex === appState.hotel.photoUrls.length - 1 
          ? 0 
          : prev.currentImageIndex + 1
      }));
    }
  }, [appState.hotel?.photoUrls?.length]);

  const prevImage = useCallback(() => {
    if (appState.hotel?.photoUrls?.length) {
      setUiState(prev => ({
        ...prev,
        currentImageIndex: prev.currentImageIndex === 0 
          ? appState.hotel.photoUrls.length - 1 
          : prev.currentImageIndex - 1
      }));
    }
  }, [appState.hotel?.photoUrls?.length]);

  const handlePageChange = useCallback((page) => {
    setHasNavigatedFromInitialPage(true);
    setRoomsState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const handleShare = useCallback(async () => {
    // Clean URL by removing any query parameters that might contain hotel ID
    const cleanUrl = window.location.origin + window.location.pathname;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: appState.hotel.name,
          text: `Check out ${appState.hotel.name} in ${appState.hotel.locality && `${appState.hotel.locality}, `}${appState.hotel.district}, Bhutan`,
          url: cleanUrl,
        });
      } catch (err) {
        // Error sharing
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(cleanUrl);
    }
  }, [appState.hotel?.name, appState.hotel?.district]);

  const openReviewSheet = useCallback(() => {
    // This function is no longer needed in HotelDetailsPage
    // Review functionality moved to GuestDashboard
  }, []);

  const closeReviewSheet = useCallback(() => {
    // This function is no longer needed in HotelDetailsPage
    // Review functionality moved to GuestDashboard
  }, []);

  const handleReviewSubmitSuccess = useCallback(() => {
    // This function is no longer needed in HotelDetailsPage
    // Review functionality moved to GuestDashboard
  }, []);

  const toggleDescription = useCallback(() => {
    setUiState(prev => ({ ...prev, isDescriptionExpanded: !prev.isDescriptionExpanded }));
  }, []);

  // Delete review handler
  const handleDeleteReview = useCallback(async (reviewId) => {
    if (!reviewId) return;
    
    try {
      // Call PATCH API to mark review as deleted
      await api.patch(`/reviews/${reviewId}/deleted`, {
        deleted: true
      });
      
      // Update the review in local state to show deletion request status
      setTestimonialsState(prev => ({
        ...prev,
        testimonials: prev.testimonials.map(testimonial => 
          testimonial.id === reviewId 
            ? { ...testimonial, deletionRequested: true }
            : testimonial
        )
      }));
      
      // Show success message
      // Review deletion requested successfully
    } catch (error) {
      // Error requesting review deletion
    }
  }, []);

  // Loading state - show Ezeeroom loader while fetching critical hotel data
  if (appState.loading && !appState.criticalDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <SimpleSpinner 
            size={32} 
            text="Loading hotel details..."
            className="mb-4"
          />
        </div>
      </div>
    );
  }

  // Error state - only show when hotel details fetch fails (not secondary data)
  if (appState.error && !appState.criticalDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">
              Something went wrong
            </CardTitle>
            <CardDescription>{appState.error || "Hotel not found"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" /> Return Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const transformedHotel = {
    ...appState.hotel,
    images:
      appState.hotel.photoUrls?.length > 0
        ? appState.hotel.photoUrls
        : ["https://via.placeholder.com/1000x600?text=No+Hotel+Image"],
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Optimized header for mobile */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 sm:h-16 items-center justify-between pr-4 sm:px-4 relative">
          {/* Left side - Navigation */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 relative z-10">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Back</span>
            </Button>
            {/* Home link - Hidden on mobile, visible on desktop */}
            <Button asChild variant="ghost" className="hidden sm:flex p-2">
              <Link to="/">
                Home
              </Link>
            </Button>
          </div>

          {/* Center - Hotel Name (appears on scroll) */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-full pointer-events-none z-0">
            <h1 
              className={`text-base sm:text-lg font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px] transition-all duration-700 ${
                uiState.showHotelNameInNavbar 
                  ? 'opacity-100 translate-y-0 scale-100 pointer-events-none' 
                  : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
              }`}
              style={{
                transitionTimingFunction: uiState.showHotelNameInNavbar 
                  ? 'cubic-bezier(0.16, 1, 0.3, 1)' // Smooth ease-out for appearing
                  : 'cubic-bezier(0.4, 0, 0.2, 1)', // Smooth ease-in for disappearing
              }}
            >
              {appState.hotel?.name}
            </h1>
          </div>

          {/* Right side - Hamburger menu for mobile */}
          <div className="flex items-center gap-1 flex-shrink-0 relative z-10">
            {/* Mobile Hamburger Menu */}
            <Sheet open={uiState.mobileMenuOpen} onOpenChange={(open) => setUiState(prev => ({ ...prev, mobileMenuOpen: open }))}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden h-8 w-8"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setUiState(prev => ({ ...prev, mobileMenuOpen: false }))}
                  >
                    <Link to="/">
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-0 py-0 lg:py-8 space-y-6 sm:space-y-8">
        {/* Hotel Name and Rating Section - Outside Image Container */}
        <div ref={hotelNameSectionRef} className="px-4 md:px-0 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <div className="flex items-center justify-between gap-4">
            {/* Hotel Name and Rating - Left Side */}
            <div className="flex flex-col gap-2 sm:gap-3 flex-1 items-start">
              {appState.hotel?.averageRating > 0 && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <StarRating 
                    rating={appState.hotel.averageRating} 
                    size={16} 
                    showRating={true}
                    className="flex-shrink-0"
                  />
                </div>
              )}
              <h1 className="text-md font-bold text-foreground leading-tight">
                {appState.hotel?.name}
              </h1>
              {/* Location - Below Hotel Name */}
              {(appState.hotel?.locality || appState.hotel?.district) && (
                <span className="text-sm text-muted-foreground font-normal flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  {appState.hotel.locality && `${appState.hotel.locality}, `}{appState.hotel.district}, Bhutan
                </span>
              )}
            </div>

            {/* Share Icon - Right Side */}
            <div className="flex-shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleShare}
                      className="h-8 w-8 sm:h-10 sm:w-10"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Share this hotel
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Enhanced Hero Section */}
        <Card className="overflow-hidden pt-0 rounded-none sm:rounded-xl border-0 sm:border border-border/60">
          <div className="relative h-48 sm:h-64 md:h-96 lg:h-[500px] flex gap-1">
            {/* Main Image Section - 80% width when thumbnails exist, full width when single image */}
            <div className={`relative h-full overflow-hidden group ${
              transformedHotel.images.length > 1 ? 'w-[80%]' : 'w-full'
            }`}>
              <img
                src={transformedHotel.images[uiState.currentImageIndex]}
                alt={transformedHotel.name}
                className="h-full w-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                onClick={() => setUiState(prev => ({ ...prev, showImageModal: true }))}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

              {/* Image Navigation */}
              {transformedHotel.images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={prevImage}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/60 hover:bg-background/80 h-8 w-8 sm:h-10 sm:w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={nextImage}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/60 hover:bg-background/80 h-8 w-8 sm:h-10 sm:w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
                  </Button>
                </>
              )}

              {/* Image Indicators */}
              <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 flex justify-center gap-1.5 sm:gap-2">
                {transformedHotel.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setUiState(prev => ({ ...prev, currentImageIndex: index }))}
                    className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-all ${
                      uiState.currentImageIndex === index
                        ? "bg-white scale-125"
                        : "bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>

              {/* Hotel Type Badge */}
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-background/90 backdrop-blur-sm text-foreground px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold border border-border/60">
                {(transformedHotel.hotelType || "Hotel").replace(/_/g, " ")}
              </div>

              {/* Image Counter */}
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-black/50 text-white px-2 sm:px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                {uiState.currentImageIndex + 1} / {transformedHotel.images.length}
              </div>
            </div>

            {/* Thumbnail Grid Section - 20% width */}
            {transformedHotel.images.length > 1 && (
              <div className="relative w-[20%] h-full flex flex-col gap-1">
                {Array.from({ length: Math.min(4, transformedHotel.images.length - 1) }).map((_, idx) => {
                  const thumbIndex = (uiState.currentImageIndex + idx + 1) % transformedHotel.images.length;
                  return (
                    <div
                      key={thumbIndex}
                      className={`relative flex-1 overflow-hidden cursor-pointer group transition-all ${
                        idx === 0 ? 'opacity-100' : 'opacity-60'
                      }`}
                      onClick={() => setUiState(prev => ({ ...prev, currentImageIndex: thumbIndex }))}
                    >
                      <img
                        src={transformedHotel.images[thumbIndex]}
                        alt={`${transformedHotel.name} - Image ${thumbIndex + 1}`}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                      />
                      {idx === 0 && (
                        <div className="absolute inset-0 border-2 border-primary/70" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <CardContent className="px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 bg-background">
            <div className="space-y-4 sm:space-y-6">
              {/* Hotel Header Section */}
              <div className="flex sm:flex-col">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="space-y-4 sm:space-y-6 flex flex-col lg:flex-row lg:gap-6">
                    {/* Hotel Description */}
                   {transformedHotel.description && (
                      <div className="w-full">
                        <div className="mb-0 space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Description
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {transformedHotel.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Simple Connect Section */}
              {(appState.hotel?.websiteUrl || appState.hotel?.facebookUrl || appState.hotel?.instagramUrl || appState.hotel?.tiktokUrl) && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Website & Social Media</h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {appState.hotel?.websiteUrl && (
                      <a
                        href={appState.hotel.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        <span>Visit Website</span>
                      </a>
                    )}

                    {appState.hotel?.facebookUrl && (
                      <a
                        href={appState.hotel.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline"
                      >
                        <Facebook className="h-4 w-4" />
                        <span>Facebook</span>
                      </a>
                    )}

                    {appState.hotel?.instagramUrl && (
                      <a
                        href={appState.hotel.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline"
                      >
                        <Instagram className="h-4 w-4" />
                        <span>Instagram</span>
                      </a>
                    )}

                    {appState.hotel?.tiktokUrl && (
                      <a
                        href={appState.hotel.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline"
                      >
                        <TikTokIcon className="h-4 w-4" />
                        <span>TikTok</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Check-in/Check-out Times */}
              <div className="mt-6 pt-4 border-t border-border/50">
                <div className="flex flex-row items-start gap-6">
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Check-in</h4>
                    <p className="text-sm font-semibold text-foreground">{formatTime(appState.hotel?.checkinTime)}</p>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Check-out</h4>
                    <p className="text-sm font-semibold text-foreground">{formatTime(appState.hotel?.checkoutTime)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="col-span-1 lg:col-span-2 space-y-8">
            {/* Amenities Section */}
            <Card className="border border-border/60 rounded-xl overflow-hidden">
              <div className="flex items-start gap-3 px-5 py-4 border-b border-border/60">
                <div className="w-0.5 self-stretch bg-primary rounded-full min-h-[1.5rem]" />
                <h3 className="text-sm font-semibold text-foreground pt-0.5">Hotel Amenities</h3>
              </div>
              <CardContent className="pt-4 px-5 pb-5">
                <div className="flex flex-row flex-wrap gap-2">
                  {appState.hotel.amenities?.map((amenity, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center py-1.5 px-3 text-xs font-medium bg-muted rounded-full text-foreground"
                    >
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hotel Location Map - Mobile View */}
            <div className="lg:hidden">
              <HotelMap
                hotelName={appState.hotel?.name}
                latitude={appState.hotel?.latitude || appState.hotel?.hotelLatitude}
                longitude={appState.hotel?.longitude || appState.hotel?.hotelLongitude}
                address={appState.hotel?.address}
                locality={appState.hotel?.locality}
                district={appState.hotel?.district}
              />
            </div>

            {/* Testimonials Section */}
            <Card className="border border-border/60 rounded-xl overflow-hidden">
              <div className="flex items-start gap-3 px-5 py-4 border-b border-border/60">
                <div className="w-0.5 self-stretch bg-primary rounded-full min-h-[1.5rem]" />
                <div className="flex items-center justify-between flex-1">
                  <h3 className="text-sm font-semibold text-foreground pt-0.5">Guest Reviews</h3>
                  {reviewerAvatars.avatarUrls.length > 0 && (
                    <AvatarCircles
                      avatarUrls={reviewerAvatars.avatarUrls}
                      hasMore={reviewerAvatars.hasMore}
                      className="ml-2"
                    />
                  )}
                </div>
              </div>
              <CardContent className="pt-4 px-5 pb-5">
                {testimonialsState.loading ? (
                  <div className="flex justify-center py-8">
                    <SimpleSpinner 
                      size={24} 
                      text="Loading testimonials..."
                      className="mb-2"
                    />
                  </div>
                ) : testimonialsState.error ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      {testimonialsState.error}
                    </p>
                  </div>
                ) : testimonialsState.testimonials.length > 0 ? (
                  <div className="space-y-4">
                    {testimonialsState.testimonials.map((testimonial) => (
                      <div
                        key={testimonial.id}
                        className="border border-border/40 rounded-lg p-4 transition-colors duration-200 hover:border-border/70"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-muted border border-border/50 flex items-center justify-center overflow-hidden">
                              {testimonial.userProfilePicUrl ? (
                                <img
                                  src={testimonial.userProfilePicUrl}
                                  alt={testimonial.userName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-muted-foreground">
                                  {testimonial.userName?.charAt(0)?.toUpperCase() || 'G'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {testimonial.userName}
                                </span>
                                <StarRating 
                                  rating={testimonial.rating} 
                                  size={14} 
                                  showRating={false}
                                  className="flex-shrink-0"
                                />
                              </div>
                              
                              <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-2">
                                <span className="text-xs text-muted-foreground sm:text-right">
                                  {new Date(testimonial.createdAt).toLocaleDateString()}
                                </span>
                                
                                {/* Three-dot menu for hotel_admin role - only for their own hotel */}
                                {isHotelOwner() && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 sm:h-6 sm:w-6 hover:bg-muted transition-colors duration-200 ml-auto sm:ml-0"
                                      >
                                        <MoreVertical className="h-4 w-4 sm:h-4 sm:w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                      <DropdownMenuItem
                                        onClick={() => !testimonial.deleted && handleDeleteReview(testimonial.id)}
                                        className={`${
                                          testimonial.deleted 
                                            ? "text-gray-400 cursor-not-allowed" 
                                            : "text-red-600 focus:text-red-600 focus:bg-red-50"
                                        }`}
                                        disabled={testimonial.deleted || testimonial.deletionRequested}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {testimonial.deleted 
                                          ? 'Review requested for deletion' 
                                          : testimonial.deletionRequested 
                                            ? 'Requested for deletion' 
                                            : 'Request Delete'
                                        }
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                            
                            {testimonial.comment && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                "{testimonial.comment}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {testimonialsState.pagination && (() => {
                      const pageInfo = testimonialsState.pagination.page || {};
                      const totalPages = pageInfo.totalPages || 0;
                      const totalElements = pageInfo.totalElements || testimonialsState.testimonials.length;
                      const isLast = pageInfo.last !== undefined ? pageInfo.last : (testimonialsState.currentPage >= totalPages - 1);
                      
                      return totalPages > 1 && !isLast && (
                        <div className="flex justify-center pt-6 pb-2">
                          <Button
                            variant="outline"
                            onClick={() => setTestimonialsState(prev => ({ 
                              ...prev, 
                              currentPage: prev.currentPage + 1 
                            }))}
                            disabled={testimonialsState.loading}
                            className="flex items-center gap-2 px-6 py-2"
                          >
                            {testimonialsState.loading ? (
                              <>
                                <Spinner size="sm" />
                                Loading...
                              </>
                            ) : (
                              <>
                                Load More Reviews
                                {totalElements > 0 && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({testimonialsState.testimonials.length} of {totalElements} shown)
                                  </span>
                                )}
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">
                      No reviews yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Rooms Section */}
            <div ref={roomsSectionRef} className="space-y-4 scroll-mt-24">
              <div className="flex items-center justify-between px-1 sm:px-0">
                <div className="flex items-center gap-3">
                  <div className="w-0.5 h-6 bg-primary rounded-full" />
                  <h2 className="text-sm font-semibold text-foreground tracking-tight">
                    Available Rooms
                  </h2>
                </div>
                {roomsState.loading && (
                  <SimpleSpinner
                    size={24}
                    text="Loading rooms..."
                    className="mb-2"
                  />
                )}
              </div>

              <div className="space-y-6 min-h-[400px]">
                {roomsState.availableRooms.length > 0
                  ? roomsState.availableRooms.map((room) => (
                      <Card
                        key={room.id}
                        className="overflow-hidden transition-colors duration-200 border border-border/60 hover:border-border group bg-background rounded-xl"
                      >
                        <div className="flex flex-col lg:flex-row">
                          <div className="lg:w-1/3 relative flex-shrink-0 overflow-hidden">
                            <RoomImageCarousel
                              images={
                                room.imageUrl && Array.isArray(room.imageUrl) && room.imageUrl.length > 0
                                  ? room.imageUrl
                                  : [`https://via.placeholder.com/500x300?text=Room+${room.roomNumber}`]
                              }
                              roomNumber={room.roomNumber}
                              roomType={room.roomType}
                              isActive={room.isActive}
                            />
                          </div>

                          <div className="flex flex-1 flex-col justify-between p-6">
                            <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="space-y-2">
                                  <CardTitle className="text-xl">
                                    {room.roomType} - Room {room.roomNumber}
                                  </CardTitle>
                                  <CardDescription className="text-sm">
                                    - {room.description}
                                  </CardDescription>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xl font-bold text-foreground">
                                    {appState.hotel.lowestPrice ? (
                                      <>
                                        <span className="text-base font-normal text-muted-foreground">
                                          From{" "}
                                        </span>
                                        Nu.{" "}
                                        {new Intl.NumberFormat("en-IN").format(
                                          appState.hotel.lowestPrice
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        Nu.{" "}
                                        {new Intl.NumberFormat("en-IN").format(
                                          room.price
                                        )}
                                      </>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    per night
                                  </p>
                                </div>
                              </div>

                              {room.amenities?.length > 0 && (
                                <div>
                                    {/* <h4 className="font-light text-sm mb-3 text-black">
                                      Room Amenities
                                    </h4> */}
                                  <div className="flex flex-wrap gap-2">
                                    {room.amenities.map((amenity, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-muted border border-border/60 text-foreground"
                                      >
                                        <span>{amenity}</span>
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Room Image Preview Section */}
                            {room.imageUrl && Array.isArray(room.imageUrl) && room.imageUrl.length > 1 && (
                              <div className="mt-6 pt-4 border-t">
                                <div className="mb-4">
                                  {/* <h4 className="text-sm font-medium text-muted-foreground mb-3">
                                    Room Photos
                                  </h4> */}
                                  <div className="flex gap-2 overflow-x-auto pb-2">
                                    {room.imageUrl.map((image, index) => (
                                      <button
                                        key={index}
                                        onClick={() => {
                                          setRoomImageModal({
                                            isOpen: true,
                                            selectedImage: image
                                          });
                                        }}
                                        className="flex-shrink-0 relative group transition-all duration-200 hover:ring-2 ring-muted-foreground/30 ring-offset-1"
                                      >
                                        <img
                                          src={image}
                                          alt={`Room ${room.roomNumber} - Photo ${index + 1}`}
                                          className="h-16 w-24 object-cover rounded-md transition-all duration-200 opacity-70 hover:opacity-100 hover:scale-105"
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="mt-6 pt-4 border-t">
                              <RoomBookingCard room={room} hotelId={id} hotel={appState.hotel} />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  : !roomsState.loading && (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center py-12">
                            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                              No rooms available
                            </h3>
                            <p className="text-base text-muted-foreground">
                              Please try different dates or contact the hotel
                              directly.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
              </div>

              {/* Enhanced Pagination */}
              {roomsState.paginationData && roomsState.paginationData.page?.totalPages > 1 && (
                <div className="flex flex-col items-center gap-4 pt-4">
                  {/* Pagination Info */}
                  <div className="text-sm text-muted-foreground">
                    Showing {roomsState.availableRooms.length} of {roomsState.paginationData.page?.totalElements || 0} rooms
                  </div>
                  
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (roomsState.paginationData?.page?.hasPrevious && !roomsState.loading)
                              handlePageChange(roomsState.currentPage - 1);
                          }}
                          className={
                            !roomsState.paginationData?.page?.hasPrevious || roomsState.loading
                              ? "pointer-events-none opacity-50"
                              : undefined
                          }
                        />
                      </PaginationItem>
                      {[...Array(roomsState.paginationData.page?.totalPages || 0).keys()].map(
                        (page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              isActive={roomsState.currentPage === page}
                              onClick={(e) => {
                                e.preventDefault();
                                if (!roomsState.loading)
                                  handlePageChange(page);
                              }}
                              className={roomsState.loading ? "pointer-events-none opacity-50" : undefined}
                            >
                              {page + 1}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (roomsState.paginationData?.page?.hasNext && !roomsState.loading) {
                              handlePageChange(roomsState.currentPage + 1);
                            }
                          }}
                          className={
                            !roomsState.paginationData?.page?.hasNext || roomsState.loading
                              ? "pointer-events-none opacity-50"
                              : undefined
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  
                  {/* Page Info */}
                  <div className="text-xs text-muted-foreground">
                    Page {roomsState.currentPage + 1} of {roomsState.paginationData.page?.totalPages || 1}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Hidden on mobile, visible on lg screens and up */}
          <aside className="hidden lg:block space-y-6 sticky top-16 self-start">

            {/* Hotel Location Map */}
            <HotelMap
              hotelName={appState.hotel?.name}
              latitude={appState.hotel?.latitude || appState.hotel?.hotelLatitude}
              longitude={appState.hotel?.longitude || appState.hotel?.hotelLongitude}
              address={appState.hotel?.address}
              locality={appState.hotel?.locality}
              district={appState.hotel?.district}
            />

            {/* Website & Social Media Card - Desktop Sidebar */}
            {(appState.hotel?.websiteUrl || appState.hotel?.facebookUrl || appState.hotel?.instagramUrl || appState.hotel?.tiktokUrl) && (
              <Card className="border border-border/60 rounded-xl overflow-hidden">
                <div className="flex items-start gap-3 px-4 py-3 border-b border-border/60">
                  <div className="w-0.5 self-stretch bg-primary rounded-full min-h-[1.25rem]" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-0.5">Website & Social Media</h3>
                </div>
                <CardContent className="space-y-1 pt-3 px-4 pb-4">
                  {appState.hotel.websiteUrl && (
                    <a
                      href={appState.hotel.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline py-1"
                    >
                      <Globe className="h-4 w-4" />
                      <span>Visit Website</span>
                    </a>
                  )}

                  {appState.hotel.facebookUrl && (
                    <a
                      href={appState.hotel.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline py-1"
                    >
                      <Facebook className="h-4 w-4" />
                      <span>Facebook</span>
                    </a>
                  )}

                  {appState.hotel.instagramUrl && (
                    <a
                      href={appState.hotel.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline py-1"
                    >
                      <Instagram className="h-4 w-4" />
                      <span>Instagram</span>
                    </a>
                  )}

                  {appState.hotel.tiktokUrl && (
                    <a
                      href={appState.hotel.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline py-1"
                    >
                      <TikTokIcon className="h-4 w-4" />
                      <span>TikTok</span>
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Info Card */}
            <Card className="border border-border/60 rounded-xl overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-3 border-b border-border/60">
                <div className="w-0.5 self-stretch bg-primary rounded-full min-h-[1.25rem]" />
                <h3 className="text-sm font-semibold text-foreground pt-0.5">Quick Information</h3>
              </div>
              <CardContent className="space-y-0 pt-0 px-4">
                {/* Hotel Type */}
                <div className="py-3 border-b border-border/40 last:border-b-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Hotel Type</p>
                  <p className="text-sm font-semibold text-foreground">
                    {(appState.hotel.hotelType || "Hotel").replace(/_/g, " ")}
                  </p>
                </div>

                {/* Location */}
                <div className="py-3 border-b border-border/40 last:border-b-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Location</p>
                  <p className="text-sm font-semibold text-foreground">
                    {appState.hotel.locality && `${appState.hotel.locality}, `}{appState.hotel.district}
                  </p>
                </div>

                {/* Address */}
                {appState.hotel.address && (
                  <div className="py-3 border-b border-border/40 last:border-b-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Address</p>
                    <p className="text-sm font-semibold text-foreground">{appState.hotel.address}</p>
                  </div>
                )}

                {/* Total Rooms */}
                <div className="py-3 border-b border-border/40 last:border-b-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total Rooms</p>
                  <p className="text-sm font-semibold text-foreground">
                    {roomsState.paginationData?.page?.totalElements || 0}
                  </p>
                </div>

                {/* Check-in Time */}
                <div className="py-3 border-b border-border/40 last:border-b-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Check-in</p>
                  <p className="text-sm font-semibold text-foreground">{formatTime(appState.hotel?.checkinTime)}</p>
                </div>

                {/* Check-out Time */}
                <div className="py-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Check-out</p>
                  <p className="text-sm font-semibold text-foreground">{formatTime(appState.hotel?.checkoutTime)}</p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Footer />

      {/* Image Modal for mobile */}
      <Sheet open={uiState.showImageModal} onOpenChange={(open) => 
        setUiState(prev => ({ ...prev, showImageModal: open }))
      }>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>{appState.hotel.name} - Images</SheetTitle>
          </SheetHeader>
          <div className="mt-6 relative h-full">
            <img
              src={transformedHotel.images[uiState.currentImageIndex]}
              alt={transformedHotel.name}
              className="h-full w-full object-contain"
            />
            {transformedHotel.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {transformedHotel.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setUiState(prev => ({ ...prev, currentImageIndex: index }))}
                    className={`h-2 w-2 rounded-full transition-all ${
                      uiState.currentImageIndex === index
                        ? "bg-primary scale-125"
                        : "bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Room Image Modal */}
      {roomImageModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="relative bg-white shadow-2xl overflow-hidden max-w-[95vw] max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setRoomImageModal({ isOpen: false, selectedImage: null })}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white/90 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-lg transition-colors duration-200"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
            </button>
            
            {/* Image Container */}
            <div className="flex items-center justify-center">
              {roomImageModal.selectedImage && (
                <img
                  src={roomImageModal.selectedImage}
                  alt="Room Photo"
                  className="max-w-full max-h-[80vh] object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HotelDetailsPage;
