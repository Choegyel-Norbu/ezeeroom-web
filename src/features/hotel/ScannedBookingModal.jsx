import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/dialog";
import { Button } from "@/shared/components/button";
import { Badge } from "@/shared/components/badge";
import { Separator } from "@/shared/components/separator";
import { Alert, AlertDescription } from "@/shared/components/alert";
import { 
  QrCode, 
  Calendar, 
  MapPin, 
  Users, 
  Phone, 
  CreditCard, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Building,
  Bed,
  RefreshCw,
  ExternalLink,
  Mail,
  Key,
} from "lucide-react";
import { Spinner } from "@/components/ui/ios-spinner";
import { toast } from "sonner";
import api from "../../shared/services/Api";

const ScannedBookingModal = ({ isOpen, onClose, scannedData }) => {
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');

  useEffect(() => {
    if (isOpen && scannedData) {
      if (scannedData.error) {
        setError(scannedData.error);
        setVerificationStatus('invalid');
        return;
      }
      
      // If scanned data contains full booking info, use it directly
      if (scannedData.id || scannedData.bookingId) {
        setBookingDetails(scannedData);
        verifyBooking(scannedData);
      } else {
        setError('Invalid QR code format');
        setVerificationStatus('invalid');
      }
    }
  }, [isOpen, scannedData]);

  const verifyBooking = async (data) => {
    try {
      setLoading(true);
      setVerificationStatus('verifying');
      
      const bookingId = data.id || data.bookingId;
      const response = await api.get(`/bookings/${bookingId}`);
      
      if (response.status === 200) {
        // Merge scanned data with verified data from database
        const verifiedData = {
          ...data,
          ...response.data,
          verified: true,
          verificationTime: new Date().toISOString()
        };
        
        setBookingDetails(verifiedData);
        setVerificationStatus('verified');
        
        toast.success("Booking Verified", {
          description: "This is a valid booking",
          duration: 6000
        });
      }
    } catch (err) {
      
      setError('Unable to verify booking. Please check manually.');
      setVerificationStatus('error');
      
      toast.error("Verification Failed", {
        description: "Could not verify booking with database",
        duration: 6000
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `Nu ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'verifying':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Verifying...</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Verification Failed</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Invalid QR Code</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const checkIn = async () => {
    if (!bookingDetails?.id && !bookingDetails?.bookingId) {
      setError('No booking data available');
      return;
    }

    setCheckingIn(true);
    setError('');
    setCheckInMessage('');

    try {
      const bookingId = bookingDetails.id || bookingDetails.bookingId;
      const response = await api.put(`/bookings/${bookingId}/status/checked_in`);
      
      // Handle the response from ResponseEntity.ok("Booking status updated successfully.")
      if (response.status === 200) {
        // Update the local booking data with new status
        setBookingDetails(prev => ({
          ...prev,
          status: 'CHECKED_IN'
        }));
        setCheckInMessage('Check-in successful! Guest has been checked in.');
        
        toast.success("Check-in Successful!", {
          description: "Guest has been checked in successfully",
          duration: 6000
        });
        
        // Clear the success message after 5 seconds
        setTimeout(() => {
          setCheckInMessage('');
        }, 5000);
      } else {
        setError('Failed to check in');
      }
    } catch (err) {
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 404) {
        setError('Booking not found');
      } else if (err.response?.status === 400) {
        setError('Invalid status value');
      } else if (err.response?.status === 403) {
        setError('You are not authorized to perform this action');
      } else if (err.response?.status === 409) {
        setError('Cannot check in. The booking may be in an invalid state.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
      
      toast.error("Check-in Failed", {
        description: "Unable to check in guest. Please try again.",
        duration: 6000
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const InfoItem = ({ icon: Icon, label, value, className = "" }) => (
    <div className={`flex items-start gap-3 py-3 ${className}`}>
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-sm text-muted-foreground break-words">{value}</div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5" />
            Booking Details
            <div className="flex items-center gap-2 ml-auto">
              {getStatusBadge()}
              {checkingIn && (
                <Spinner size="sm" className="text-muted-foreground" />
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Booking information from scanned QR code
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-destructive">Error</div>
                <div className="text-sm text-destructive/80">{error}</div>
              </div>
            </div>
          )}

          {/* Check-in Success Message */}
          {checkInMessage && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm font-medium">
                {checkInMessage}
              </AlertDescription>
            </Alert>
          )}

          {bookingDetails && (
            <>
              {/* Booking Status */}
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground mb-2">Current Status</div>
                <Badge variant="outline" className="text-base px-4 py-2">
                  {bookingDetails.status || 'CONFIRMED'}
                </Badge>
              </div>

              <Separator />

              {/* Hotel and Room Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Accommodation Details
                </h3>
                
                <div className="grid gap-0 divide-y">
                  <InfoItem
                    icon={MapPin}
                    label="Hotel"
                    value={
                      <div>
                        <div>{bookingDetails.hotelName || 'Hotel Name Not Available'}</div>
                        {bookingDetails.hotelDistrict && (
                          <div className="text-xs text-muted-foreground mt-1">
                            📍 {bookingDetails.hotelDistrict}
                          </div>
                        )}
                      </div>
                    }
                  />
                  
                  <InfoItem
                    icon={Bed}
                    label="Room"
                    value={`Room ${bookingDetails.roomNumber || 'N/A'}`}
                  />
                  
                  <div className="grid sm:grid-cols-2 sm:divide-x">
                    <InfoItem
                      icon={Calendar}
                      label="Check-in"
                      value={formatDate(bookingDetails.checkInDate)}
                      className="sm:pr-4"
                    />
                    
                    <InfoItem
                      icon={Calendar}
                      label="Check-out"
                      value={formatDate(bookingDetails.checkOutDate)}
                      className="sm:pl-4"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Guest Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Guest Information
                </h3>
                
                <div className="grid gap-0 divide-y">
                  {bookingDetails.name && (
                    <InfoItem
                      icon={User}
                      label="Guest Name"
                      value={bookingDetails.name}
                    />
                  )}
                  
                  <div className="grid sm:grid-cols-2 sm:divide-x">
                    {bookingDetails.phone && (
                      <InfoItem
                        icon={Phone}
                        label="Phone"
                        value={`+975 ${bookingDetails.phone}`}
                        className="sm:pr-4"
                      />
                    )}
                    
                    {bookingDetails.email && (
                      <InfoItem
                        icon={Mail}
                        label="Email"
                        value={bookingDetails.email}
                        className="sm:pl-4"
                      />
                    )}
                  </div>
                  
                  <InfoItem
                    icon={Users}
                    label="Number of Guests"
                    value={`${bookingDetails.guests || 1} ${(bookingDetails.guests || 1) === 1 ? 'Guest' : 'Guests'}`}
                  />
                </div>
              </div>

              <Separator />

              {/* Payment and Booking Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment & Booking Details
                </h3>
                
                <div className="grid gap-0 divide-y">
                  <div className="flex items-start gap-3 py-3">
                    <CreditCard className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">Total Amount</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(bookingDetails.totalPrice)}
                      </div>
                    </div>
                  </div>
                  
                  <InfoItem
                    icon={Clock}
                    label="Booked On"
                    value={formatTime(bookingDetails.createdAt || bookingDetails.bookingTime)}
                  />
                </div>
              </div>

              {/* Check-in Action */}
              {verificationStatus === 'verified' && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground">Guest Check-in</h3>
                    <Button 
                      className="w-full"
                      onClick={checkIn}
                      disabled={checkingIn || bookingDetails?.status === 'CHECKED_IN'}
                    >
                      {checkingIn ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Checking In...
                        </>
                      ) : bookingDetails?.status === 'CHECKED_IN' ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Already Checked In
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Check In Guest
                        </>
                      )}
                    </Button>
                    {bookingDetails?.status === 'CHECKED_IN' && (
                      <p className="text-sm text-muted-foreground text-center">
                        Guest has already been checked in
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScannedBookingModal;