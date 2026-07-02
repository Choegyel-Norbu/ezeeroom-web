import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/shared/utils";

const PropertyTypeSection = () => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // CDN base URL - can be configured via VITE_CDN_BASE_URL environment variable
  const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || window.location.origin;

  // Property types arranged from lowest to highest standard/priority
  const propertyTypes = [
    {
      id: "ONE_STAR",
      label: "One Star",
      image: `${CDN_BASE_URL}/images/onestar.jpg`,
      description: "Basic accommodations"
    },
    {
      id: "TWO_STAR",
      label: "Two Star",
      image: `${CDN_BASE_URL}/images/twostar.jpg`,
      description: "Comfortable stays"
    },
    {
      id: "BUDGET",
      label: "Budget Hotels",
      image: `${CDN_BASE_URL}/images/budget1.jpg`,
      description: "Affordable accommodations"
    },
    {
      id: "THREE_STAR",
      label: "Three Star",
      image: `${CDN_BASE_URL}/images/threestar.avif`,
      description: "Quality mid-range stays"
    },
    {
      id: "HOMESTAY",
      label: "Homestays",
      image: `${CDN_BASE_URL}/images/homestay.jpg`,
      description: "Authentic local experiences"
    },
    {
      id: "FOUR_STAR",
      label: "Four Star",
      image: `${CDN_BASE_URL}/images/four.jpg`,
      description: "Upscale accommodations"
    },
    {
      id: "FIVE_STAR",
      label: "Five Star",
      image: `${CDN_BASE_URL}/images/fivestar.jpeg`,
      description: "Premium luxury stays"
    },
    {
      id: "BOUTIQUE",
      label: "Boutique Hotels",
      image: `${CDN_BASE_URL}/images/suite.jpg`,
      description: "Unique boutique experiences"
    },
    {
      id: "RESORT",
      label: "Resorts",
      image: `${CDN_BASE_URL}/images/resort.jpg`,
      description: "Luxury resort experiences"
    },
  ];

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === "left" 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
    }
  };

  const handlePropertyTypeClick = (propertyType) => {
    navigate(`/hotels?hotelType=${propertyType.id}`);
  };

  // Check scroll position on mount and resize
  React.useEffect(() => {
    handleScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, []);

  return (
    <section className="pt-12 md:pb-12 px-4 bg-white dark:bg-slate-900">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Browse by property type
          </h3>
          
          {/* Navigation Arrows - Desktop */}
          <div className="hidden md:flex items-center justify-center gap-3">
            <button
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                !canScrollLeft && "opacity-40 cursor-not-allowed border-slate-100 text-slate-300"
              )}
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                !canScrollRight && "opacity-40 cursor-not-allowed border-slate-100 text-slate-300"
              )}
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Property Type Cards */}
        <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-8 snap-x snap-mandatory"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            onScroll={handleScroll}
          >
            {propertyTypes.map((property) => {
              return (
                <div
                  key={property.id}
                  onClick={() => handlePropertyTypeClick(property)}
                  className="flex-shrink-0 w-64 md:w-72 cursor-pointer group snap-start"
                >
                  <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ease-out border border-white/10 transform hover:-translate-y-1">
                    {/* Image */}
                    <img
                      src={property.image}
                      alt={property.label}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      onError={(e) => {
                        // Fallback to a placeholder if image fails
                        e.target.src = `${CDN_BASE_URL}/images/suite.jpg`;
                      }}
                    />
                    
                    {/* Modern Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050203]/80 via-[#050203]/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-white text-md tracking-wide">
                        {property.label}
                      </h3>
                      <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100">
                        <p className="text-white/80 text-sm font-light mt-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                          {property.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyTypeSection;

