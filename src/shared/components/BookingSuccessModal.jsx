import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { Button } from "./button";
import { Separator } from "./separator";
import { Badge } from "./badge";
import { CheckCircle, QrCode, Calendar, MapPin, Users, Phone, CreditCard, AlertCircle, Info } from "lucide-react";
import QRCodeGenerator from "./QRCodeGenerator";
const BookingSuccessModal = ({ isOpen, onClose, bookingData }) => {
  const [showQRCode, setShowQRCode] = useState(false);

  const handleViewQRCode = () => {
    setShowQRCode(true);
  };

  const handleCloseQRCode = () => {
    setShowQRCode(false);
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

  const formatCurrency = (amount) => {
    return `Nu ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const InfoItem = ({ icon: Icon, label, value, className = "", highlight = false }) => (
    <div className={`flex items-start gap-3 py-3 ${className}`}>
      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${highlight ? 'text-green-600' : 'text-muted-foreground'}`} />
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium ${highlight ? 'text-green-700' : 'text-foreground'}`}>
          {label}
        </div>
        <div className={`text-sm ${highlight ? 'text-green-600' : 'text-muted-foreground'} break-words`}>
          {value}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Sticky Header */}
          <DialogHeader className="flex-shrink-0 sticky top-0 bg-background z-10 pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-lg text-green-700">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Booking Confirmed!
            </DialogTitle>
            <DialogDescription className="text-sm">
              Your room has been successfully booked. Here are your booking details:
            </DialogDescription>
          </DialogHeader>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pt-4 scrollbar-hide">
            <div className="space-y-6">
            

            <Separator />

            {/* Booking Details */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">Booking Details</h3>
              
              <div className="grid gap-0 divide-y">
                {/* Hotel & Room Info */}
                <InfoItem
                  icon={MapPin}
                  label="Hotel & Room"
                  value={
                    <div>
                      <div>{bookingData?.hotelName || bookingData?.room?.hotelName || 'Hotel Name'}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Room {bookingData?.roomNumber || bookingData?.room?.roomNumber || 'N/A'}
                      </div>
                    </div>
                  }
                />

                {/* Dates */}
                <InfoItem
                  icon={Calendar}
                  label="Stay Duration"
                  value={
                    <div>
                      <div>Check-in: {formatDate(bookingData?.checkInDate)}</div>
                      <div>Check-out: {formatDate(bookingData?.checkOutDate)}</div>
                    </div>
                  }
                />

                {/* Guest Info */}
                <InfoItem
                  icon={Users}
                  label="Number of Guests"
                  value={`${bookingData?.guests || 1} ${(bookingData?.guests || 1) === 1 ? 'Guest' : 'Guests'}`}
                />

                {/* Payment Info */}
                <div className="flex items-start gap-3 py-3 border-l-4 border-l-blue-500 pl-3">
                  <CreditCard className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-blue-700">Total Amount</div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(bookingData?.totalPrice)}
                    </div>
                    {bookingData?.paymentStatus === 'completed' && (
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Payment Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Button - Commented out as requested */}
            {/* <Button 
              onClick={handleViewQRCode}
              className="w-full"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Generate QR Code
            </Button> */}

            <Separator />

            {/* Instructions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-600" />
                <div className="text-sm font-medium text-amber-700">Important Reminders</div>
              </div>
              <div className="pl-6 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>Arrive at the hotel on your check-in date</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>Bring a valid ID for verification</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>Verify your identity using the passcode generated during booking</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>Your unique passcode is available in your user dashboard</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>Contact the hotel for any special requests</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t">
              <Button 
                onClick={onClose}
                variant="outline" 
                className="w-full"
              >
                Close
              </Button>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <QRCodeGenerator 
        isOpen={showQRCode}
        onClose={handleCloseQRCode}
        bookingData={bookingData}
      />

    </>
  );
};

export default BookingSuccessModal;