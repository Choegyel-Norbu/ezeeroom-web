import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn, calculateDistance, parseCoordinates } from "@/shared/utils";
import {
  DEFAULT_NEARBY_RADIUS,
  NEARBY_RADIUS_OPTIONS,
  getNextLargerRadius,
  getRadiusLabel,
} from "@/shared/constants/nearbySearch";
import {
  MapPin,
  Search,
  X,
  Clock,
  Navigation,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import SimpleSpinner from "@/shared/components/SimpleSpinner";
import StarRating from "@/shared/components/star-rating";


import { Button } from "@/shared/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/card";
import { Badge } from "@/shared/components/badge";
import { Input } from "@/shared/components/input";
import { Label } from "@/shared/components/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/select";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/components/pagination";

import api from "../../shared/services/Api";
import Footer from "../../layouts/Footer";
import { EzeeRoomLogo } from "@/shared/components";

const HotelCard = React.memo(({ hotel }) => (
  <Link to={`/hotel/${hotel.id}`} className="group block focus:outline-none">
    {/* Mobile: horizontal row  |  sm+: vertical stack */}
    <div className="flex flex-row sm:flex-col rounded-xl border border-border/50 bg-background overflow-hidden transition-colors duration-200 hover:border-border">

      {/* ── Image ── */}
      <div className="relative w-[120px] shrink-0 sm:w-full sm:aspect-[4/3] overflow-hidden">
        {/* on mobile, fill the fixed-width column; on sm+ keep aspect ratio */}
        <img
          src={hotel.image}
          alt={hotel.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Verified pill — top-left corner */}
        {hotel.verified && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
              <Shield className="h-2.5 w-2.5" /> Verified
            </span>
          </div>
        )}

        {/* Price pill — bottom of image, always visible on sm+ */}
        {hotel.lowestPrice > 0 && (
          <div className="absolute bottom-0 inset-x-0 hidden sm:flex items-end justify-end p-2.5">
            <div className="rounded-lg bg-background/95 backdrop-blur-sm px-2.5 py-1.5 border border-border/40">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground leading-none mb-0.5">From</p>
              <p className="text-sm font-bold text-foreground leading-none">Nu. {hotel.lowestPrice.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 min-w-0 p-3 sm:p-4">

        {/* Type badge */}
        <span className="inline-block self-start mb-2 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {hotel.type?.replace(/_/g, " ")}
        </span>

        {/* Name */}
        <h3 className="font-semibold text-sm sm:text-[15px] text-foreground line-clamp-1 leading-snug group-hover:text-primary transition-colors duration-150">
          {hotel.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 text-primary/70" />
          <span className="line-clamp-1">{hotel.locality && `${hotel.locality}, `}{hotel.district}</span>
        </div>

        {/* Rating (if present) */}
        {hotel.averageRating > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <StarRating rating={hotel.averageRating} size={11} showRating={false} />
            <span className="text-xs font-semibold text-yellow-700">{hotel.averageRating.toFixed(1)}</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-border/40">
          {/* Distance or check-in */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {hotel.distance !== null ? (
              <>
                <Navigation className="h-3 w-3 shrink-0" />
                <span>{hotel.distance >= 1000 ? `${(hotel.distance / 1000).toFixed(1)} km` : `${hotel.distance}m`} away</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 shrink-0" />
                <span>{hotel.checkinTime}</span>
              </>
            )}
          </div>

          {/* Price on mobile / View on sm+ */}
          {hotel.lowestPrice > 0 ? (
            <p className="text-xs font-bold text-foreground sm:hidden shrink-0">
              Nu. {hotel.lowestPrice.toLocaleString()}
            </p>
          ) : null}
          <span className="hidden sm:inline text-xs font-medium text-primary group-hover:underline underline-offset-2 shrink-0">
            View Details →
          </span>
        </div>
      </div>
    </div>
  </Link>
));

const HotelListingPage = () => {
  const location = useLocation();
  
  // Consolidated state management to reduce re-renders
  const [appState, setAppState] = useState({
    hotels: [],
    loading: true,
    initialLoadDone: false,
    isInitialLoad: true, // Track if we're in the initial load phase
  });

  const [searchState, setSearchState] = useState({
    district: "",
    locality: "",
    hotelType: "all",
    sortBy: "default",
  });

  const [mobileSearchField, setMobileSearchField] = useState("district");
  const [mobileSearchValue, setMobileSearchValue] = useState("");

  const [pagination, setPagination] = useState({
    page: 0,
    size: 6,
    totalPages: 1,
    totalElements: 0,
  });
  const [showNearbyHeading, setShowNearbyHeading] = useState(false);
  
  // User location state - now derived from URL params to avoid duplicate requests
  const [userLocation, setUserLocation] = useState(null);
  
  // Nearby search radius state
  const [nearbyRadius, setNearbyRadius] = useState(DEFAULT_NEARBY_RADIUS);

  // Refs for performance optimization
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastRequestRef = useRef(null);
  const pendingRequestRef = useRef(null); // Track pending requests to prevent duplicates
  const lastFetchKeyRef = useRef(null);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (mobileSearchField === "district") {
      setMobileSearchValue(searchState.district);
    } else if (mobileSearchField === "locality") {
      setMobileSearchValue(searchState.locality);
    } else {
      setMobileSearchValue(searchState.hotelType || "all");
    }
  }, [
    mobileSearchField,
    searchState.district,
    searchState.locality,
    searchState.hotelType,
  ]);

  // Memoized hotel type options for consistent usage across breakpoints
  const hotelCategoryOptions = useMemo(
    () => [
      { value: "all", label: "All Types" },
      { value: "ONE_STAR", label: "One Star" },
      { value: "TWO_STAR", label: "Two Star" },
      { value: "THREE_STAR", label: "Three Star" },
      { value: "FOUR_STAR", label: "Four Star" },
      { value: "FIVE_STAR", label: "Five Star" },
      { value: "BUDGET", label: "Budget" },
      { value: "BOUTIQUE", label: "Boutique" },
      { value: "RESORT", label: "Resort" },
      { value: "HOMESTAY", label: "Homestay" },
    ],
    []
  );

  // Memoized function to generate fetch key for deduplication
  const generateFetchKey = useCallback((page, district, locality, hotelType, sortBy) => {
    return `${page}-${district.trim()}-${locality.trim()}-${hotelType}-${sortBy}`;
  }, []);

  // Derived flags - simplified to only require lat/lon (radius has a default)
  const isNearbySearch = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Boolean(params.get("lat") && params.get("lon"));
  }, [location.search]);

  // Extract user location from URL params to avoid duplicate geolocation requests
  // This uses the location that was already obtained in HeroLG component
  useEffect(() => {
    if (isNearbySearch) {
      const params = new URLSearchParams(location.search);
      const lat = params.get("lat");
      const lon = params.get("lon");
      const radius = params.get("radius") || DEFAULT_NEARBY_RADIUS;
      
      // Validate coordinates using shared utility
      const coordinates = parseCoordinates(lat, lon);
      
      if (coordinates) {
        // Use validated location from URL params for distance calculation
        setUserLocation({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          accuracy: null, // Not available from URL params
        });
        
        // Set radius state
        setNearbyRadius(radius);
      } else {
        // Invalid coordinates in URL - clear and show regular search
        setUserLocation(null);
        toast.error("Invalid location coordinates", {
          description: "The location in the URL is invalid. Please try searching again.",
          duration: 6000,
        });
      }
    } else {
      setUserLocation(null);
    }
  }, [isNearbySearch, location.search]);

  // Optimized fetch function with request deduplication and caching
  const fetchHotels = useCallback(
    async (page = 0, searchDistrict = "", searchLocality = "", searchHotelType = "", sortByParam = "default", nearbyParams = null) => {
      // Generate unique key for this request
      const fetchKey = nearbyParams 
        ? `nearby-${nearbyParams.lat}-${nearbyParams.lon}-${nearbyParams.radius}-${page}`
        : generateFetchKey(page, searchDistrict, searchLocality, searchHotelType, sortByParam);
      
      // Prevent duplicate API calls - check both completed and pending requests
      if (lastFetchKeyRef.current === fetchKey) {
        return;
      }
      
      // Prevent duplicate pending requests
      if (pendingRequestRef.current === fetchKey) {
        return;
      }

      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Mark this request as pending
      pendingRequestRef.current = fetchKey;

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        setAppState(prev => ({ 
          ...prev, 
          loading: true, 
        }));
        lastFetchKeyRef.current = fetchKey;

        let endpoint;
        
        // Check if this is a nearby search
        if (nearbyParams) {
          const params = new URLSearchParams({
            lat: nearbyParams.lat,
            lon: nearbyParams.lon,
            radius: nearbyParams.radius,
            page: page.toString(),
            size: pagination.size.toString(),
          });
          endpoint = `/hotels/nearby?${params.toString()}`;
        } else {
          endpoint = `/hotels/list?page=${page}&size=${pagination.size}`;
          const isSearchActive = searchDistrict.trim() || searchLocality.trim() || 
            (searchHotelType && searchHotelType !== "all");

          // Build endpoint based on search/sort criteria
          if (isSearchActive) {
            const params = new URLSearchParams({
              page: page.toString(),
              size: pagination.size.toString(),
            });

            if (searchDistrict.trim()) params.append("district", searchDistrict.trim());
            if (searchLocality.trim()) params.append("locality", searchLocality.trim());
            if (searchHotelType && searchHotelType !== "all") params.append("hotelType", searchHotelType);

            endpoint = `/hotels/search?${params.toString()}`;
          } else {
            // Apply sorting only when not searching
            if (sortByParam === "price-high") {
              endpoint = `/hotels/sortedByHighestPrice?page=${page}&size=${pagination.size}`;
            } else if (sortByParam === "price-low") {
              endpoint = `/hotels/sortedByLowestPrice?page=${page}&size=${pagination.size}`;
            }
          }
        }

        // Store current request reference
        lastRequestRef.current = { endpoint, fetchKey };

        const response = await api.get(endpoint, { signal });

        // Check if this is still the current request
        if (lastRequestRef.current?.fetchKey === fetchKey) {
          // Handle nested response structure for nearby searches
          let hotelsData = [];
          let pageData = {};
          
          if (nearbyParams) {
            // Nearby search response structure: { content: [{ content: [], pageNumber: 0, ... }], page: {...} }
            const nestedContent = response.data.content?.[0];
            hotelsData = nestedContent?.content || [];
            pageData = nestedContent || response.data.page || {};
          } else {
            // Regular search response structure
            hotelsData = response.data.content?.[0]?.content || response.data.content || [];
            pageData = response.data.content?.[0] || response.data.page || response.data;
          }
          
          setAppState(prev => ({
            ...prev,
            hotels: hotelsData,
            loading: false,
          }));

          setPagination({
            page: pageData.pageNumber || pageData.pageable?.pageNumber || pageData.number || 0,
            size: pageData.pageSize || pageData.size || 6,
            totalPages: pageData.totalPages || 1,
            totalElements: pageData.totalElements || 0,
          });
        }
        
        // Clear pending request
        if (pendingRequestRef.current === fetchKey) {
          pendingRequestRef.current = null;
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          // Clear pending request for aborted requests
          if (pendingRequestRef.current === fetchKey) {
            pendingRequestRef.current = null;
          }
          return;
        }

        if (lastRequestRef.current?.fetchKey === fetchKey) {
          setAppState(prev => ({
            ...prev,
            hotels: [],
            loading: false,
          }));
        }
        
        // Clear pending request on error
        if (pendingRequestRef.current === fetchKey) {
          pendingRequestRef.current = null;
        }
      }
    },
    [pagination.size, generateFetchKey]
  );

  // Handle initial URL parameters and data loading
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const params = new URLSearchParams(location.search);
    const districtParam = params.get("district") || "";
    const hotelTypeParam = params.get("hotelType") || "all";
    
    // Check for nearby search parameters
    const lat = params.get("lat");
    const lon = params.get("lon");
    const radius = params.get("radius") || "0.5"; // Default to 0.5km if not specified
    
    if (lat && lon) {
      // Nearby search mode - make API call directly
      const nearbyParams = { lat, lon, radius };
      setShowNearbyHeading(true);
      setNearbyRadius(radius);
      fetchHotels(0, "", "", "all", "default", nearbyParams);
    } else {
      // Regular search mode
      setShowNearbyHeading(false);
      setSearchState(prev => ({
        ...prev,
        district: districtParam,
        hotelType: hotelTypeParam,
      }));
      
      fetchHotels(0, districtParam, "", hotelTypeParam, "default");
    }
    
    setAppState(prev => ({ 
      ...prev, 
      initialLoadDone: true,
      isInitialLoad: false
    }));
  }, [location.search, fetchHotels]);

  // Optimized search effect with debouncing
  useEffect(() => {
    // Don't run during initial load or if initial load not done
    if (!appState.initialLoadDone || appState.isInitialLoad || isNearbySearch) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounced timer
    debounceTimerRef.current = setTimeout(() => {
      const isSearchActive = searchState.district.trim() || searchState.locality.trim() || 
        (searchState.hotelType && searchState.hotelType !== "all");
      fetchHotels(0, searchState.district, searchState.locality, searchState.hotelType, 
        isSearchActive ? "default" : searchState.sortBy);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    searchState.district,
    searchState.locality,
    searchState.hotelType,
    fetchHotels,
    appState.initialLoadDone,
    appState.isInitialLoad,
    isNearbySearch,
  ]);

  // Separate effect for sort changes (no debounce needed)
  useEffect(() => {
    // Don't run during initial load or if initial load not done
    if (!appState.initialLoadDone || appState.isInitialLoad || isNearbySearch) return;
    
    const isSearchActive = searchState.district.trim() || searchState.locality.trim() || 
      (searchState.hotelType && searchState.hotelType !== "all");
    if (!isSearchActive) {
      fetchHotels(0, searchState.district, searchState.locality, searchState.hotelType, searchState.sortBy);
    }
  }, [
    searchState.sortBy,
    fetchHotels,
    appState.initialLoadDone,
    appState.isInitialLoad,
    searchState.district,
    searchState.locality,
    searchState.hotelType,
    isNearbySearch,
  ]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Clear pending request on cleanup
      pendingRequestRef.current = null;
    };
  }, []);

  // Track scroll direction for navbar visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar when at top of page
      if (currentScrollY < 10) {
        setIsNavbarVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }
      
      // Determine scroll direction
      const scrollingDown = currentScrollY > lastScrollY.current;
      const scrollingUp = currentScrollY < lastScrollY.current;
      
      // Show when scrolling up, hide when scrolling down
      if (scrollingUp) {
        setIsNavbarVisible(true);
      } else if (scrollingDown) {
        setIsNavbarVisible(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Memoized handlers to prevent unnecessary re-renders
  const handleSearch = useCallback(() => {
    const isSearchActive = searchState.district.trim() || searchState.locality.trim() || 
      (searchState.hotelType && searchState.hotelType !== "all");
    fetchHotels(0, searchState.district, searchState.locality, searchState.hotelType, 
      isSearchActive ? "default" : searchState.sortBy);
    setShowNearbyHeading(false);
  }, [searchState.district, searchState.locality, searchState.hotelType, searchState.sortBy, fetchHotels]);

  const handleClearSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      district: "",
      locality: "",
      hotelType: "all",
    }));
    
    window.history.replaceState({}, "", "/hotels");
    setShowNearbyHeading(false);
    fetchHotels(0, "", "", "all", searchState.sortBy);
  }, [fetchHotels, searchState.sortBy]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      const params = new URLSearchParams(location.search);
      const lat = params.get("lat");
      const lon = params.get("lon");
      const radius = params.get("radius") || nearbyRadius;
      
      if (lat && lon) {
        // Nearby search pagination
        const nearbyParams = { lat, lon, radius };
        fetchHotels(newPage, "", "", "all", "default", nearbyParams);
      } else {
        // Regular search pagination
        const isSearchActive = searchState.district.trim() || searchState.locality.trim() || 
          (searchState.hotelType && searchState.hotelType !== "all");
        fetchHotels(newPage, searchState.district, searchState.locality, searchState.hotelType, 
          isSearchActive ? "default" : searchState.sortBy);
      }
    }
  }, [pagination.totalPages, searchState.district, searchState.locality, searchState.hotelType, searchState.sortBy, fetchHotels, location.search, nearbyRadius]);

  const handleDistrictChange = useCallback((value) => {
    setSearchState(prev => ({ ...prev, district: value }));
  }, []);

  const handleLocalityChange = useCallback((value) => {
    setSearchState(prev => ({ ...prev, locality: value }));
  }, []);

  const handleHotelTypeChange = useCallback((value) => {
    setSearchState(prev => ({ ...prev, hotelType: value }));
  }, []);

  const handleSortChange = useCallback((value) => {
    setSearchState(prev => ({ ...prev, sortBy: value }));
  }, []);

  const handleRadiusChange = useCallback((value) => {
    setNearbyRadius(value);
    const params = new URLSearchParams(location.search);
    const lat = params.get("lat");
    const lon = params.get("lon");
    
    if (lat && lon) {
      // Update URL with new radius
      const newParams = new URLSearchParams({ lat, lon, radius: value });
      window.history.replaceState({}, "", `/hotels?${newParams.toString()}`);
      
      // Fetch hotels with new radius
      const nearbyParams = { lat, lon, radius: value };
      fetchHotels(0, "", "", "all", "default", nearbyParams);
    }
  }, [location.search, fetchHotels]);

  const handleExpandRadius = useCallback(() => {
    const nextRadius = getNextLargerRadius(nearbyRadius);
    if (nextRadius) {
      handleRadiusChange(nextRadius);
    }
  }, [nearbyRadius, handleRadiusChange]);

  // Check if we can expand the radius further
  const canExpandRadius = useMemo(() => {
    return getNextLargerRadius(nearbyRadius) !== null;
  }, [nearbyRadius]);

  const handleMobileFieldChange = useCallback((value) => {
    setMobileSearchField(value);
    if (value === "district") {
      setMobileSearchValue(searchState.district);
    } else if (value === "locality") {
      setMobileSearchValue(searchState.locality);
    } else {
      setMobileSearchValue(searchState.hotelType || "all");
    }
  }, [searchState.district, searchState.locality, searchState.hotelType]);

  const handleMobileSearch = useCallback(() => {
    const nextState = {
      ...searchState,
      district: mobileSearchField === "district" ? mobileSearchValue : searchState.district,
      locality: mobileSearchField === "locality" ? mobileSearchValue : searchState.locality,
      hotelType: mobileSearchField === "hotelType" ? (mobileSearchValue || "all") : searchState.hotelType,
    };

    setSearchState(nextState);

    const hasSearchFilters =
      nextState.district.trim() ||
      nextState.locality.trim() ||
      (nextState.hotelType && nextState.hotelType !== "all");

    fetchHotels(
      0,
      nextState.district,
      nextState.locality,
      nextState.hotelType,
      hasSearchFilters ? "default" : nextState.sortBy
    );
    setShowNearbyHeading(false);
  }, [fetchHotels, mobileSearchField, mobileSearchValue, searchState]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Memoized computed values
  const isSearchActive = useMemo(() => {
    return searchState.district.trim() || searchState.locality.trim() || 
      (searchState.hotelType && searchState.hotelType !== "all");
  }, [searchState.district, searchState.locality, searchState.hotelType]);

  const pageTitle = useMemo(() => {
    if (showNearbyHeading) return "Hotels Near You";
    if (!isSearchActive) return "All Lodges registered with us";
    
    const parts = [];
    if (searchState.locality) parts.push(`Hotels in ${searchState.locality}`);
    if (searchState.district) parts.push(`District: ${searchState.district}`);
    if (searchState.hotelType && searchState.hotelType !== "all") {
      const typeLabel = searchState.hotelType.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      parts.push(typeLabel);
    }
    
    return parts.join(' - ') || "Search Results";
  }, [isSearchActive, showNearbyHeading, searchState.district, searchState.locality, searchState.hotelType]);

  // Utility function to format time from "HH:MM:SS" to "H:MM AM/PM"
  const formatTime = useCallback((timeString) => {
    if (!timeString) return "N/A";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }, []);

  const transformedHotels = useMemo(() => {
    const hotelsWithDistance = appState.hotels.map((hotel) => {
      // Extract latitude and longitude from hotel data
      const hotelLat = hotel.latitude ? parseFloat(hotel.latitude) : null;
      const hotelLon = hotel.longitude ? parseFloat(hotel.longitude) : null;
      
      // Calculate distance if user location and hotel coordinates are available
      let distance = null;
      if (userLocation && hotelLat !== null && hotelLon !== null) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          hotelLat,
          hotelLon
        );
      }

      return {
        id: hotel.id,
        name: hotel.name,
        district: hotel.district,
        locality: hotel.locality,
        price: hotel.lowestPrice,
        lowestPrice: hotel.lowestPrice,
        image: hotel.photoUrl || hotel.photoUrls?.[0] || 
          `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&auto=format`,
        type: hotel.hotelType || "Hotel",
        amenities: hotel.amenities || [],
        address: hotel.address,
        averageRating: hotel.averageRating || 0,
        verified: hotel.verified || hotel.isVerified || false,
        checkinTime: formatTime(hotel.checkinTime || "12:00:00"),
        checkoutTime: formatTime(hotel.checkoutTime || "14:00:00"),
        distance,
      };
    });

    // Sort by distance when in nearby search mode and distances are available
    if (isNearbySearch && userLocation) {
      return hotelsWithDistance.sort((a, b) => {
        // Hotels with distance come first, sorted by distance ascending
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        // Hotels with distance come before hotels without distance
        if (a.distance !== null && b.distance === null) {
          return -1;
        }
        if (a.distance === null && b.distance !== null) {
          return 1;
        }
        // If both don't have distance, maintain original order
        return 0;
      });
    }

    return hotelsWithDistance;
  }, [appState.hotels, formatTime, userLocation, isNearbySearch]);

  // Memoized pagination component
  const renderPagination = useMemo(() => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-8">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (pagination.page > 0) handlePageChange(pagination.page - 1);
                }}
                className={pagination.page === 0 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {[...Array(pagination.totalPages).keys()].map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={pageNumber === pagination.page}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(pageNumber);
                  }}
                >
                  {pageNumber + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (pagination.page < pagination.totalPages - 1) {
                    handlePageChange(pagination.page + 1);
                  }
                }}
                className={
                  pagination.page >= pagination.totalPages - 1
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }, [pagination.totalPages, pagination.page, handlePageChange]);

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header with Logo */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isNavbarVisible ? "translate-y-0" : "-translate-y-full"
      } bg-white/80 backdrop-blur-md border-b border-slate-200/60`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <EzeeRoomLogo size="default" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-12">
        
        {/* Search Section */}
        <div className={cn(
          "sticky z-40 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 transition-all duration-300",
          isNavbarVisible ? "top-20" : "top-4"
        )}>
          <div className="mx-auto max-w-5xl">
            <div className="relative rounded-full bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200">
              
              {/* Desktop Search */}
              <div className="hidden sm:flex items-center divide-x divide-slate-100">
                <div className="flex-1 px-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-2.5">Where</label>
                  <div className="relative">
                    <Input
                      placeholder="Search district..."
                      value={searchState.district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="border-0 bg-transparent p-0 pl-2.5 h-6 text-sm font-medium placeholder:text-slate-400 focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="flex-1 px-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-2.5">Locality</label>
                  <div className="relative">
                    <Input
                      placeholder="Town or area..."
                      value={searchState.locality}
                      onChange={(e) => handleLocalityChange(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="border-0 bg-transparent p-0 pl-2.5 h-6 text-sm font-medium placeholder:text-slate-400 focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="flex-1 px-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-2.5">Type</label>
                  <Select value={searchState.hotelType} onValueChange={handleHotelTypeChange}>
                    <SelectTrigger className="border-0 bg-transparent p-0 pl-2.5 h-6 text-sm font-medium focus:ring-0">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotelCategoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pl-2 pr-1">
                  <Button
                    onClick={handleSearch}
                    disabled={appState.loading}
                    className="h-10 w-10 rounded-full bg-primary p-0 text-primary-foreground hover:bg-primary/90 shadow-md transition-transform active:scale-95 flex items-center justify-center"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Mobile Search */}
              <div className="sm:hidden p-0.5">
                <div className="flex items-center gap-1.5">
                   <Select value={mobileSearchField} onValueChange={handleMobileFieldChange}>
                      <SelectTrigger className="w-[100px] h-8 rounded-full border-0 bg-slate-100 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="district">District</SelectItem>
                        <SelectItem value="locality">Locality</SelectItem>
                        <SelectItem value="hotelType">Type</SelectItem>
                      </SelectContent>
                   </Select>

                   <div className="flex-1 relative">
                      {mobileSearchField === "hotelType" ? (
                        <Select
                          value={mobileSearchValue || "all"}
                          onValueChange={(value) => setMobileSearchValue(value)}
                        >
                          <SelectTrigger className="w-full h-8 border-0 bg-transparent text-sm focus:ring-0">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {hotelCategoryOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Search..."
                          value={mobileSearchValue}
                          onChange={(e) => setMobileSearchValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleMobileSearch()}
                          className="w-full h-8 border-0 bg-transparent text-sm focus-visible:ring-0 pl-2"
                        />
                       )}
                    </div>

                    <Button
                      size="icon"
                      onClick={handleMobileSearch}
                      disabled={appState.loading}
                      className="h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-sm"
                    >
                      <Search className="h-3.5 w-3.5" />
                    </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Header & Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {pageTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {appState.loading 
                ? "Searching for the best stays..." 
                : `${pagination.totalElements} accommodations found`}
            </p>
            
            {/* Active Filters */}
            {(isSearchActive || showNearbyHeading) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {searchState.district && (
                  <Badge variant="secondary" className="bg-white border border-slate-200 text-slate-700">
                    District: {searchState.district}
                  </Badge>
                )}
                {searchState.locality && (
                  <Badge variant="secondary" className="bg-white border border-slate-200 text-slate-700">
                    Locality: {searchState.locality}
                  </Badge>
                )}
                {searchState.hotelType && searchState.hotelType !== "all" && (
                  <Badge variant="secondary" className="bg-white border border-slate-200 text-slate-700">
                    Type: {searchState.hotelType.replace(/_/g, " ")}
                  </Badge>
                )}
                {showNearbyHeading && (
                  <Badge variant="secondary" className="bg-white border border-slate-200 text-slate-700">
                    Within {nearbyRadius}km
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="h-6 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Sort & Radius Controls */}
          <div className="flex items-center gap-3">
            {/* Radius Selector for Nearby Search */}
            {showNearbyHeading && !appState.loading && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">Radius</span>
                <Select value={nearbyRadius} onValueChange={handleRadiusChange}>
                  <SelectTrigger className="w-[100px] rounded-full border-slate-200 bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEARBY_RADIUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Sort */}
            {!isSearchActive && !showNearbyHeading && !appState.loading && (
               <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-slate-500">Sort by</span>
                 <Select value={searchState.sortBy} onValueChange={handleSortChange}>
                   <SelectTrigger className="w-[160px] rounded-full border-slate-200 bg-white text-sm">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="default">Recommended</SelectItem>
                     <SelectItem value="price-low">Price: Low to High</SelectItem>
                     <SelectItem value="price-high">Price: High to Low</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
            )}
          </div>
        </div>

        {/* Grid Content */}
        {appState.loading ? (
           <div className="flex h-64 flex-col items-center justify-center gap-4">
             <SimpleSpinner size={40} className="text-primary" />
             <p className="text-sm font-medium text-slate-500 animate-pulse">Finding perfect stays for you...</p>
           </div>
        ) : (
           <>
             {transformedHotels.length > 0 ? (
               <>
                 <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                   {transformedHotels.map((hotel) => (
                     <HotelCard key={hotel.id} hotel={hotel} />
                   ))}
                 </div>
                 {renderPagination}
               </>
            ) : (
              appState.initialLoadDone && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-6 rounded-full bg-slate-100 p-6">
                    {showNearbyHeading ? (
                      <MapPin className="h-10 w-10 text-slate-400" />
                    ) : (
                      <Search className="h-10 w-10 text-slate-400" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {showNearbyHeading 
                      ? `No hotels within ${getRadiusLabel(nearbyRadius)}` 
                      : "No hotels found"}
                  </h3>
                  <p className="mt-2 max-w-md text-slate-500">
                    {showNearbyHeading 
                      ? canExpandRadius 
                        ? "Try expanding your search radius to find more hotels nearby."
                        : "There are no hotels registered near your location. Try searching by district instead."
                      : "We couldn't find any matches for your search. Try adjusting your filters or search for a different location."}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    {showNearbyHeading && canExpandRadius && (
                      <Button 
                        onClick={handleExpandRadius}
                        className="rounded-full px-8"
                      >
                        Expand to {getRadiusLabel(getNextLargerRadius(nearbyRadius))}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={handleClearSearch}
                      className="rounded-full px-8"
                    >
                      {showNearbyHeading ? "Search by district" : "Clear all filters"}
                    </Button>
                  </div>
                </div>
              )
            )}
           </>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default HotelListingPage;