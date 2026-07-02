import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { Separator } from "./separator";
import { Download, Share, QrCode, Copy, Check, User, Building, Calendar, Users, CreditCard, Key, Info } from "lucide-react";
import { toast } from "sonner";

const QRCodeGenerator = ({ isOpen, onClose, bookingData }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && bookingData) {
      generateQRCode();
    }
  }, [isOpen, bookingData]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      
      // Create booking information object for QR code (matching API response structure)
      const qrData = {
        id: bookingData.id || bookingData.bookingId,
        userId: bookingData.userId,
        roomId: bookingData.roomId,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        guests: bookingData.guests,
        status: bookingData.status || "CONFIRMED",
        totalPrice: parseFloat(bookingData.totalPrice || 0),
        createdAt: bookingData.createdAt || bookingData.bookingTime || new Date().toISOString(),
        name: bookingData.name || bookingData.guestName || "Guest",
        phone: bookingData.phone,
        email: bookingData.email,
        roomNumber: bookingData.roomNumber || bookingData.room?.roomNumber,
        passcode: bookingData.passcode,
        hotelName: bookingData.hotelName || bookingData.room?.hotelName,
        hotelDistrict: bookingData.hotelDistrict,
        hotelLatitude: bookingData.hotelLatitude || "",
        hotelLongitude: bookingData.hotelLongitude || ""
      };

      // Convert to JSON string for QR code
      const qrString = JSON.stringify(qrData);
      
      // Generate QR code with high quality settings
      const url = await QRCode.toDataURL(qrString, {
        width: 256,
        margin: 2,
        color: {
          dark: '#050203',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodeUrl(url);
    } catch (error) {
      
      toast.error("Failed to generate QR code", {
        duration: 6000
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `ezeeroom-booking-${bookingData.id || 'qrcode'}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("QR code downloaded successfully!", {
      duration: 6000
    });
  };

  const shareQRCode = async () => {
    if (!qrCodeUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      
      const file = new File([blob], `ezeeroom-booking-${bookingData.id || 'qrcode'}.png`, {
        type: 'image/png'
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Ezeeroom Booking QR Code',
          text: `Booking confirmation for ${bookingData.hotelName || 'your hotel'}`,
          files: [file]
        });
        toast.success("QR code shared successfully!", {
          duration: 6000
        });
      } else {
        // Fallback to copying URL to clipboard
        await copyBookingInfo();
      }
    } catch (error) {
      
      toast.error("Failed to share QR code", {
        duration: 6000
      });
    }
  };

  const copyBookingInfo = async () => {
    try {
      const bookingInfo = `
🏨 Ezeeroom Booking Confirmation

📧 Email: ${bookingData.email || 'N/A'}
📱 Phone: +975 ${bookingData.phone || 'N/A'}

🏢 Hotel: ${bookingData.hotelName || 'N/A'}
📍 District: ${bookingData.hotelDistrict || 'N/A'}
🚪 Room: ${bookingData.roomNumber || 'N/A'}

📅 Check-in: ${bookingData.checkInDate}
📅 Check-out: ${bookingData.checkOutDate}
👥 Guests: ${bookingData.guests}
💰 Total: Nu ${bookingData.totalPrice}
📊 Status: ${bookingData.status || 'CONFIRMED'}
      `.trim();

      await navigator.clipboard.writeText(bookingInfo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Booking details copied to clipboard!", {
        duration: 6000
      });
    } catch (error) {
      
      toast.error("Failed to copy booking details", {
        duration: 6000
      });
    }
  };

  const SummaryItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="text-sm text-muted-foreground">{label}: </span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Sticky Header */}
        <DialogHeader className="flex-shrink-0 sticky top-0 bg-background z-10 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5 text-blue-600" />
            Booking Confirmation
          </DialogTitle>
          <DialogDescription className="text-sm">
            Your booking QR code contains all the details for quick verification
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pt-4 scrollbar-hide">
          <div className="space-y-6">
          {/* QR Code Display */}
          <div className="flex justify-center p-6 border border-border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center w-64 h-64 border border-dashed border-muted-foreground/30 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="Booking QR Code" 
                className="w-64 h-64 rounded-lg shadow-sm"
              />
            ) : (
              <div className="flex items-center justify-center w-64 h-64 border border-dashed border-muted-foreground/30 rounded-lg">
                <QrCode className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
          </div>

          <Separator />

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={downloadQRCode} 
                disabled={!qrCodeUrl}
                variant="outline"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button 
                onClick={shareQRCode} 
                disabled={!qrCodeUrl}
                variant="outline"
                size="sm"
              >
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          <Separator />

          {/* Instructions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <div className="text-sm font-medium text-foreground">How to use</div>
            </div>
            <div className="pl-6 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Show this QR code at hotel check-in</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Download or share for offline access</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Keep your booking details safe</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="pt-4 border-t">
            <Button onClick={onClose} variant="outline" className="w-full">
              Close
            </Button>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeGenerator;