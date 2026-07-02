import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/shared/utils";
import { DEFAULT_NEARBY_RADIUS } from "@/shared/constants/nearbySearch";
const EzeeroomHero = "/images/erHero.webp";
const EzeeroomHeroMobile = "/images/heroIMG.webp";
import { toast } from "sonner";

import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { Separator } from "@/shared/components/separator";

import { MapPin, Clock, Shield, Search, Loader2 } from "lucide-react";

const HeroLG = () => {
  const [searchDistrict, setSearchDistrict] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isFindingLocation, setIsFindingLocation] = useState(false);
  const navigate = useNavigate();

  const validateAndSearch = () => {
    setSearchError("");

    if (!searchDistrict || searchDistrict.trim() === "") {
      setSearchError("Please enter a district to search");
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(searchDistrict.trim())) {
      setSearchError("District must contain only letters");
      return;
    }

    const searchParams = new URLSearchParams({
      district: searchDistrict.trim(),
    });

    navigate(`/hotels?${searchParams.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      validateAndSearch();
    }
  };

  const handleStartExploring = () => {
    // Navigate to hotel listing page without filters
    navigate("/hotels");
  };

  const handleSearchNearby = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported", {
        description: "Please use a device that supports location services.",
        duration: 6000,
      });
      return;
    }

    setIsFindingLocation(true);
    const loadingToast = toast.loading("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        toast.dismiss(loadingToast);
        setIsFindingLocation(false);

        const searchParams = new URLSearchParams({
          lat: coords.latitude.toString(),
          lon: coords.longitude.toString(),
          radius: DEFAULT_NEARBY_RADIUS,
        });

        navigate(`/hotels?${searchParams.toString()}`);
      },
      (error) => {
        toast.dismiss(loadingToast);
        setIsFindingLocation(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location access denied", {
              description: "Please enable location permissions in your browser settings to use the nearby search feature.",
              duration: 6000,
            });
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location unavailable", {
              description: "Location information is unavailable. Please try again later.",
              duration: 6000,
            });
            break;
          case error.TIMEOUT:
            toast.error("Location request timed out", {
              description: "The location request took too long. Please try again.",
              duration: 6000,
            });
            break;
          default:
            toast.warning("Location accuracy is a bit low", {
              description: "We couldn't get a very precise location. Nearby stays might not be exact.",
              duration: 6000,
            });
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      <style>
        {`
          .hero-section-responsive {
            background-image: url(${EzeeroomHeroMobile});
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          }
          
          @media (min-width: 768px) {
            .hero-section-responsive {
              background-image: url(${EzeeroomHero});
            }
          }
        `}
      </style>
      <section 
        className="hero-section-responsive relative flex min-h-screen w-full items-center justify-center px-3 sm:px-4 pt-12 sm:pt-24 lg:pt-28 pb-6 sm:pb-8 lg:pb-12 overflow-y-auto"
      >
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center justify-center space-y-4 sm:space-y-6 lg:space-y-8 text-center">
        {/* Header Section */}
        <div className="space-y-1.5 sm:space-y-2">
          <h1 
            className="text-3xl sm:text-3xl lg:text-4xl font-semibold tracking-tight px-2"
            style={{
              color: '#ffffff',
              textShadow: '2px 2px 8px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 0, 0, 0.25)',
            }}
          >
            Discover Authentic Stays in
            <span 
              className="block"
              style={{
                color: '#facc15',
              }}
            >
              Bhutan with EzeeRoom
            </span>
          </h1>

          <p 
            className="mx-auto max-w-2xl text-base sm:text-sm px-3 sm:px-4"
            style={{
              color: '#ffffff',
              textShadow: '1px 1px 4px rgba(0, 0, 0, 0.4), 0 0 10px rgba(0, 0, 0, 0.25)',
            }}
          >
            Find your perfect stay anywhere in the country. 
            Discover authentic accommodations in unfamiliar destinations with confidence and ease.
          </p>
        </div>

        <Separator 
          className="w-16 sm:w-20 lg:w-24"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          }}
        />

        {/* Search Section (NEW) */}
        <div 
          className="w-full max-w-3xl px-2 sm:px-0"
        >
          <div className="relative rounded-3xl bg-white/10 p-2 backdrop-blur-md border border-white/20 shadow-2xl ring-1 ring-[#050203]/5">
            <div className="flex flex-row gap-2">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 group-focus-within:text-white" />
                </div>
                <Input
                  type="text"
                  placeholder="Where do you want to go? (e.g., Thimphu, Paro)"
                  className={cn(
                    "h-10 sm:h-12 pl-10 sm:pl-11 pr-3 sm:pr-4 w-full rounded-2xl text-base sm:text-base",
                    "bg-white/10 text-white placeholder:text-gray-300",
                    "border-transparent focus:border-white/30 focus:bg-white/20",
                    "focus:ring-0",
                    searchError && "border-red-400 focus:border-red-400"
                  )}
                  value={searchDistrict}
                  onChange={(e) => {
                    setSearchDistrict(e.target.value);
                    if (searchError) setSearchError("");
                  }}
                  onKeyPress={handleKeyPress}
                />
              </div>
              
              <Button
                className={cn(
                  "h-10 sm:h-12 w-10 sm:w-12 lg:w-auto px-0 sm:px-6 lg:px-8 rounded-2xl sm:rounded-3xl font-bold text-base sm:text-base tracking-wide flex items-center justify-center",
                  "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600",
                  "text-white shadow-lg hover:shadow-yellow-500/25"
                )}
                onClick={validateAndSearch}
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5 lg:hidden" />
                <span className="hidden lg:inline">Search</span>
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {searchError && (
            <div 
              className="mt-3 flex items-center justify-center gap-2 text-red-300 bg-red-900/30 py-2 px-4 rounded-lg backdrop-blur-sm border border-red-500/30 mx-auto w-fit"
            >
              <span className="text-lg">⚠</span>
              <span className="text-base font-medium">{searchError}</span>
            </div>
          )}

          {/* Popular Destinations */}
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-2">
            <span className="text-sm sm:text-sm font-medium text-white/70 mr-1 sm:mr-2">Popular:</span>
            {['Mongar', 'Trashigang', 'Thimphu', 'Punakha'].map((district) => (
              <button
                key={district}
                onClick={() => {
                  setSearchDistrict(district);
                  setSearchError("");
                }}
                className="px-4 py-1.5 text-sm sm:text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 border border-white/10 hover:border-white/30 backdrop-blur-sm"
              >
                {district}
              </button>
            ))}
          </div>
        </div>

        <Separator 
          className="w-full max-w-2xl mt-2 sm:mt-0"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          }}
        />

        {/* Call to Action */}
        <div className="space-y-3 sm:space-y-4 px-2">
          <p
            className="text-sm sm:text-sm"
            style={{
              color: "#ffffff",
              textShadow: "1px 1px 4px rgba(0, 0, 0, 0.4)",
            }}
          >
            Need a comfortable stay anywhere in Bhutan?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <Button
              type="button"
              onClick={handleStartExploring}
              className="px-5 sm:px-7 py-3 sm:py-5 text-sm sm:text-sm font-semibold rounded-full bg-white/95 text-slate-900 border border-white/80 shadow-md shadow-[#050203]/25 transition-all duration-200 hover:bg-transparent hover:text-white hover:border-white hover:shadow-lg hover:-translate-y-0.5"
            >
              Start Exploring
            </Button>
            <Button
              type="button"
              onClick={handleSearchNearby}
              disabled={isFindingLocation}
              className="px-5 sm:px-7 py-3 sm:py-5 text-sm font-semibold rounded-full bg-white/95 text-slate-900 border border-white/80 shadow-md shadow-black/25 transition-all duration-200 hover:bg-transparent hover:text-white hover:border-white hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isFindingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding...
                </>
              ) : (
                "Find nearby"
              )}
            </Button>
          </div>
        </div>
        </div>
      </section>
    </>
  );
};

export default HeroLG;
