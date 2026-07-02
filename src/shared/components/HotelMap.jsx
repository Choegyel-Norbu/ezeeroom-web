import React, { useState, useCallback } from "react";
import { MapPin, ExternalLink, Navigation } from "lucide-react";
import { Spinner } from "@/components/ui/ios-spinner";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";

const HotelMap = ({ 
  hotelName, 
  latitude, 
  longitude, 
  address, 
  locality, 
  district,
  className = "" 
}) => {
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  // Handle map load events
  const handleMapLoad = useCallback(() => {
    setMapLoading(false);
    setMapError(false);
  }, []);

  const handleMapError = useCallback(() => {
    setMapLoading(false);
    setMapError(true);
  }, []);

  // Generate Google Maps URLs for different actions
  const getGoogleMapsUrl = useCallback((type = 'place') => {
    const coords = `${latitude},${longitude}`;
    const query = encodeURIComponent(`${hotelName}, ${address || ''}, ${locality || ''}, ${district}, Bhutan`);
    
    switch (type) {
      case 'place':
        return `https://www.google.com/maps/search/?api=1&query=${coords}`;
      case 'directions':
        return `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
      case 'embed':
        // Use Google Maps embed without API key - this will show a basic map
        return `https://maps.google.com/maps?q=${coords}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      default:
        return `https://www.google.com/maps/search/?api=1&query=${coords}`;
    }
  }, [latitude, longitude, hotelName, address, locality, district]);

  // Validate coordinates
  const isValidCoordinates = latitude && longitude && 
    !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)) &&
    parseFloat(latitude) >= -90 && parseFloat(latitude) <= 90 &&
    parseFloat(longitude) >= -180 && parseFloat(longitude) <= 180;

  if (!isValidCoordinates) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <MapPin className="h-5 w-5 text-primary" />
            Hotel Location
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Location Not Available
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Location coordinates are not available for this hotel.
            </p>
            {address && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Address:</p>
                <p>{address}</p>
                {locality && <p>{locality}, {district}</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <MapPin className="h-5 w-5 text-primary" />
          Hotel Location
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Map Container */}
          <div className="relative h-64 w-full overflow-hidden rounded-lg border border-border/50">
            {mapLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Spinner size="md" />
                  <span className="text-sm">Loading map...</span>
                </div>
              </div>
            )}
            
            {mapError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Map unavailable</p>
                </div>
              </div>
            ) : (
              <iframe
                src={getGoogleMapsUrl('embed')}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={handleMapLoad}
                onError={handleMapError}
                title={`Map showing location of ${hotelName}`}
                className="transition-opacity duration-300"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="none"
              size="sm"
              onClick={() => window.open(getGoogleMapsUrl('place'), '_blank')}
              className="flex items-center gap-2 flex-1"
            >
              <ExternalLink className="h-4 w-4" />
              View on Google Maps
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HotelMap;
