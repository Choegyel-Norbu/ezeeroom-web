import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hotel } from "lucide-react";
import { Spinner } from "@/components/ui/ios-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/dialog";
import { Card, CardContent } from "@/shared/components/card";
import { useAuth } from "@/features/authentication";

const HotelSelectionDialog = ({ isOpen, onClose, onHotelSelected }) => {
  const { userId, userHotels, setSelectedHotelId, fetchUserHotels, selectedHotelId } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHotels = async () => {
      if (isOpen) {
        setLoading(true);
        try {
          // If we already have userHotels, use them
          if (userHotels && userHotels.length > 0) {
            setHotels(userHotels);
          } else if (userId && fetchUserHotels) {
            // Otherwise, fetch hotels from API
            const fetchedHotels = await fetchUserHotels(userId);
            setHotels(fetchedHotels || []);
          } else {
            setHotels([]);
          }
        } catch (error) {
          
          setHotels([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadHotels();
  }, [isOpen, userId, userHotels, fetchUserHotels, selectedHotelId]);

  const handleHotelSelect = (hotel) => {
    // Set the selected hotel ID in the auth context
    setSelectedHotelId(hotel.id);
    
    // Call the callback to notify parent component
    onHotelSelected?.(hotel);
    
    // Close dialog and navigate to dashboard
    onClose();
    navigate("/dashboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex text-md items-center gap-2">
            Select Your Hotel
          </DialogTitle>
          <DialogDescription>
            Choose the hotel you want to manage. You can switch between hotels later.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" className="text-blue-600" />
              <span className="ml-2 text-muted-foreground">Loading hotels...</span>
            </div>
          ) : hotels.length === 0 ? (
            <div className="text-center py-8">
              <Hotel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Hotels Found</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any hotels associated with your account yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {hotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-accent/50"
                  onClick={() => handleHotelSelect(hotel)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-normal text-sm">
                        {hotel.name}
                      </h3>
                    </div>
                  </CardContent>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HotelSelectionDialog;
