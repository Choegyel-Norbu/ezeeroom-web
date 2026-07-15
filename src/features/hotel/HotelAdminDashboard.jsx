import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  Home,
  Calendar,
  PieChart,
  Hotel,
  Bed,
  Package,
  Users,
  ArrowLeft,
  List,
  X,
  Bell,
  Trash2,
  CreditCard,
  CheckCircle,
  Settings,
  UtensilsCrossed,
  Lock,
  Clock,
  User,
  Shield,
  AlertTriangle,
  ChevronDown,
  Upload,
  Camera,
  Check,
  HelpCircle,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { Spinner } from "@/components/ui/ios-spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/card";
import { Button } from "@/shared/components/button";
import { Separator } from "@/shared/components/separator";
import { Badge } from "@/shared/components/badge";
import { Avatar, AvatarFallback } from "@/shared/components/avatar";
import { Input } from "@/shared/components/input";
import { Label } from "@/shared/components/label";
import { Switch } from "@/shared/components/switch";
import StaffManager from "./StaffManager";
import BookingsTrendChart from "./BookingsTrendChart";
import MonthlyPerformanceChart from "./MonthlyPerformanceChart";
import BookingVerificationDialog from "./BookingVerificationDialog";
// import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/table";
import HotelInfoForm from "./HotelInfoForm";
import RoomManager from "../admin/RoomManager";
import RoomTypeManager from "../admin/RoomTypeManager";
import BookingTable from "./BookingTable";
import CancellationRequestsTable from "./CancellationRequestsTable";
import AdminBookingForm from "./AdminBookingForm";
import BookingsInventoryTable from "./BookingsInventoryTable";
import LeaveManagement from "./LeaveManagement";
import BookingCalendar from "./BookingCalendar";
import { useAuth } from "../authentication";
import { getStorageItem, clearStorage } from "@/shared/utils/safariLocalStorage";
import api from "../../shared/services/Api";
import { TopHotelBadge } from "../../shared/components";
import { API_BASE_URL } from "../../shared/services/firebaseConfig";
import { toast } from "sonner";
import { EzeeRoomLogo } from "@/shared/components";
import SubscriptionExpirationNotification from "@/shared/components/SubscriptionExpirationNotification";
import SubscriptionLockedCard from "@/shared/components/SubscriptionLockedCard";
import { uploadFile } from "../../shared/services/uploadService";
import { calculateDaysUntil } from "@/shared/utils/subscriptionUtils";
import { generateBookingReceipt } from "../../shared/utils/receiptGenerator";
import { generateSubscriptionInvoice } from "../../shared/utils/invoiceGenerator";

const HotelAdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    userId,
    userName,
    hotelId,
    selectedHotelId,
    lastLogin,
    roles,
    isTopHotel,
    topHotelIds,
    subscriptionPlan,
    subscriptionIsActive,
    subscriptionIsExpired,
    subscriptionNextBillingDate,
    subscriptionExpirationNotification,
    fetchUserHotels,
    fetchSubscriptionData,
    userHotels,
    setSelectedHotelId,
    getSelectedHotel,
  } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [hotel, setHotel] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingsRefreshSignal, setBookingsRefreshSignal] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [leaveNotificationCount, setLeaveNotificationCount] = useState(0);
  const [leaveNotifications, setLeaveNotifications] = useState([]);
  const [loadingLeaveNotifications, setLoadingLeaveNotifications] = useState(false);
  const [showLeaveNotifications, setShowLeaveNotifications] = useState(false);
  const fetchingLeaveNotificationsRef = useRef(false);
  
  // File upload states for denied verification
  const [tradeLicense, setTradeLicense] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadErrors, setUploadErrors] = useState({});
  const [documentsSubmitted, setDocumentsSubmitted] = useState(false);

  // Receipts state
  const [receipts, setReceipts] = useState([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [receiptsPage, setReceiptsPage] = useState(0);
  const [receiptsTotalPages, setReceiptsTotalPages] = useState(1);
  const [receiptsTotalElements, setReceiptsTotalElements] = useState(0);
  const receiptsPageSize = 10;

  // Billing tab state (Invoices / Receipts)
  const [billingTab, setBillingTab] = useState("receipts");
  const [settingsSubTab, setSettingsSubTab] = useState("hotelInfo");
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [roomsSubTab, setRoomsSubTab] = useState("manage");
  const [notifyOnNewBooking, setNotifyOnNewBooking] = useState(true);
  const [notifyOnCancellation, setNotifyOnCancellation] = useState(true);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [hasTimeBasedEnabled, setHasTimeBasedEnabled] = useState(false);
  const [hasRestaurantEnabled, setHasRestaurantEnabled] = useState(false);
  const [walkInServiceChargeEnabled, setWalkInServiceChargeEnabled] = useState(false);
  const [walkInServiceChargePercent, setWalkInServiceChargePercent] = useState("");
  // false = charge added on top of room price; true = charge already included in room price
  const [walkInServiceChargeInclusive, setWalkInServiceChargeInclusive] = useState(false);
  const [savingNotifyNewBooking, setSavingNotifyNewBooking] = useState(false);
  const [savingNotifyCancellation, setSavingNotifyCancellation] = useState(false);
  const [savingGst, setSavingGst] = useState(false);
  const [savingHasTimeBased, setSavingHasTimeBased] = useState(false);
  const [savingHasRestaurant, setSavingHasRestaurant] = useState(false);
  const [savingWalkInServiceCharge, setSavingWalkInServiceCharge] = useState(false);

  // Restaurant setup form state
  const [restaurantForm, setRestaurantForm] = useState({
    restaurantName: "",
    licenseNo: "",
    address: "",
    tpn: "",
    username: "",
    password: "",
    email: "",
    phoneNumber: "",
  });
  const [restaurantFormErrors, setRestaurantFormErrors] = useState({});
  const [showRestaurantPassword, setShowRestaurantPassword] = useState(false);
  const [submittingRestaurant, setSubmittingRestaurant] = useState(false);

  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesPage, setInvoicesPage] = useState(0);
  const [invoicesTotalPages, setInvoicesTotalPages] = useState(1);
  const [invoicesTotalElements, setInvoicesTotalElements] = useState(0);
  const invoicesPageSize = 10;

  // Use selected hotel ID if available, otherwise fall back to hotelId
  const currentHotelId = selectedHotelId || hotelId;

  // Check if subscription is expired
  // Priority: 1) Use isExpired from API (most reliable), 2) Check date calculation, 3) Fall back to isActive flag
  const isSubscriptionExpired = () => {
    // First, check if API explicitly says subscription is expired
    if (subscriptionIsExpired !== null && subscriptionIsExpired !== undefined) {
      return subscriptionIsExpired === true;
    }
    
    // If no explicit expiration flag, check the billing date
    if (subscriptionNextBillingDate) {
      const daysUntilExpiration = calculateDaysUntil(subscriptionNextBillingDate);
      // Subscription is expired if the date has passed (including today, as expiration date means expired)
      // If daysUntilExpiration > 0, subscription is still valid until that date
      return daysUntilExpiration <= 0;
    }
    
    // Final fallback: use isActive flag
    return subscriptionIsActive === false;
  };

  // Define which tabs should be locked when subscription is expired
  const lockedTabs = ["rooms", "hotel", "analytics", "staff", "inventory", "leave"];

  // Redirect to dashboard if user doesn't have access to current tab
  useEffect(() => {
    if (activeTab === "staff" && roles && roles.includes("STAFF")) {
      setActiveTab("dashboard");
    }
    
    // Redirect FRONTDESK users away from restricted tabs
    if (roles && roles.includes("FRONTDESK") && !["dashboard", "booking", "leave"].includes(activeTab)) {
      setActiveTab("dashboard");
      toast.error("This feature is not available for Front Desk users.", {
        duration: 4000
      });
    }
    
    // Redirect to dashboard if trying to access locked tabs with expired subscription
    if (isSubscriptionExpired() && lockedTabs.includes(activeTab)) {
      setActiveTab("dashboard");
      toast.error("This feature is not available with an expired subscription.", {
        duration: 4000
      });
    }
  }, [activeTab, roles, subscriptionIsActive, subscriptionPlan]);

  // Simple media query hook for small screens (max-width: 640px)
  const isMobile =
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 640px)").matches
      : false;

  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        // Use currentHotelId if available, otherwise fall back to userId for backward compatibility
        const hotelIdToUse = currentHotelId || userId;
        const res = await api.get(`/hotels/${hotelIdToUse}`);
        setHotel(res.data);
      } catch (err) {
        // Error handled silently
      }
    };

    if (currentHotelId || userId) {
      fetchHotelData();
    }
  }, [currentHotelId, userId]);

  // Reset documentsSubmitted state when hotel changes or verification status changes
  useEffect(() => {
    setDocumentsSubmitted(false);
    setTradeLicense(null);
    setIdProof(null);
    setUploadErrors({});
  }, [currentHotelId, hotel?.isVerified, hotel?.verificationDenialReason]);

  // Fetch user hotels when component mounts
  useEffect(() => {
    if (userId && fetchUserHotels) {
      fetchUserHotels(userId);
    }
  }, [userId, fetchUserHotels]);

  // Ensure subscription status is fresh after returning from subscription flow
  useEffect(() => {
    const shouldRefreshByUrl = () => {
      try {
        const params = new URLSearchParams(location.search || "");
        return (
          params.get("refreshSubscription") === "1" ||
          params.get("subscribed") === "1" ||
          params.get("subscription") === "active"
        );
      } catch (_) {
        return false;
      }
    };

    const isAdminRole = roles?.includes("HOTEL_ADMIN") || roles?.includes("MANAGER");
    const needsRefresh = subscriptionIsActive == null || shouldRefreshByUrl();

    if (userId && isAdminRole && needsRefresh && typeof fetchSubscriptionData === "function") {
      // Force refresh to get latest subscription status
      fetchSubscriptionData(userId, true, selectedHotelId).finally(() => {
        // Clean URL query params after using them
        if (shouldRefreshByUrl()) {
          const cleanUrl = window.location.pathname + window.location.hash;
          navigate(cleanUrl, { replace: true });
        }
      });
    }
  }, [userId, roles, subscriptionIsActive, selectedHotelId, location.search, fetchSubscriptionData, navigate]);

  // Fetch all notifications from backend when component mounts or hotel changes
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId || !currentHotelId) return;

      try {
        setLoadingNotifications(true);
        const response = await api.get(`/notifications/hotel/${currentHotelId}/unread`);
        const fetchedNotifications = response.data;

        // Filter notifications to show BOOKING_CREATED and BOOKING_CANCELLATION_REQUEST types
        const filteredNotifications = fetchedNotifications.filter(
          (notif) => notif.type === "HOTEL_BOOKING_CREATED" || notif.type === "HOTEL_CANCELLATION_REQUEST"
        );

        // Sort notifications by createdAt (newest first) and calculate unread count
        const sortedNotifications = filteredNotifications.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const unreadNotifications = sortedNotifications.filter(
          (notif) => !notif.isRead
        );

        setNotifications(sortedNotifications);
        setUnreadCount(unreadNotifications.length);
      } catch (error) {
        // Error handled silently
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, [userId, currentHotelId]);

  // Mark all notifications as read via API
  const markAllNotificationsAsRead = async () => {
    try {
      await api.put(`/notifications/user/${userId}/markAllRead`);

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      // Error handled silently
    }
  };

  // Delete all notifications via API
  const deleteAllNotifications = async () => {
    try {
      await api.delete(`/notifications/user/${userId}`);

      // Update local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      // Error handled silently
    }
  };

  // Note: Real-time booking notifications were previously handled via WebSocket
  // For now, notifications will need to be fetched manually or via polling

  // Fetch leave notifications function
  const fetchLeaveNotifications = useCallback(async () => {
    if (currentHotelId && !fetchingLeaveNotificationsRef.current) {
      try {
        fetchingLeaveNotificationsRef.current = true;
        setLoadingLeaveNotifications(true);
        const response = await api.get(`/leaves/notifications/hotel/${currentHotelId}`);
        
        // API returns an array of notification objects with structure:
        // { id, username, roomNumber, guestName, hotelName, hotelId, title, message, type, isRead, createdAt }
        const notifications = response.data || [];
        
        // Sort notifications by createdAt (newest first)
        const sortedNotifications = notifications.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        // Filter for unread notifications (isRead === false)
        const unreadNotifications = sortedNotifications.filter(n => n.isRead === false);
        const unreadCount = unreadNotifications.length;
        
        setLeaveNotifications(sortedNotifications);
        setLeaveNotificationCount(unreadCount);
        
        // Auto-expand notifications section if there are unread notifications and leave tab is active
        if (unreadCount > 0 && activeTab === "leave") {
          setShowLeaveNotifications(true);
        }
      } catch (error) {
        // Error handled silently
        // Don't show error toast as this is a background operation
        setLeaveNotifications([]);
        setLeaveNotificationCount(0);
      } finally {
        setLoadingLeaveNotifications(false);
        fetchingLeaveNotificationsRef.current = false;
      }
    }
  }, [currentHotelId, activeTab]);

  // Fetch leave notifications on component mount
  useEffect(() => {
    fetchLeaveNotifications();
  }, [fetchLeaveNotifications]);

  // Refresh leave notifications when leave tab is clicked
  useEffect(() => {
    if (activeTab === "leave") {
      fetchLeaveNotifications();
    }
  }, [activeTab, fetchLeaveNotifications]);

  // Fetch receipts when billing tab is active
  const fetchReceipts = useCallback(async (page = 0) => {
    if (!currentHotelId) return;

    try {
      setReceiptsLoading(true);
      const response = await api.get(
        `/receipts/hotel/${currentHotelId}?page=${page}&size=${receiptsPageSize}`
      );

      if (response.data) {
        // Handle paginated response
        if (response.data.content) {
          setReceipts(response.data.content);
          setReceiptsTotalPages(response.data.totalPages || 1);
          setReceiptsTotalElements(response.data.totalElements || 0);
        } else if (Array.isArray(response.data)) {
          // Fallback for direct array response
          setReceipts(response.data);
          setReceiptsTotalPages(1);
          setReceiptsTotalElements(response.data.length);
        }
      }
    } catch (error) {
      
      toast.error("Failed to fetch receipts", {
        duration: 6000,
      });
      setReceipts([]);
      setReceiptsTotalPages(1);
      setReceiptsTotalElements(0);
    } finally {
      setReceiptsLoading(false);
    }
  }, [currentHotelId, receiptsPageSize]);

  // Fetch invoices when invoices sub-tab is active
  const fetchInvoices = useCallback(
    async (page = 0) => {
      if (!currentHotelId) return;

      try {
        setInvoicesLoading(true);
        const response = await api.get(
          `/invoices/hotel/${currentHotelId}?page=${page}&size=${invoicesPageSize}`
        );

        if (response.data) {
          if (response.data.content !== undefined) {
            setInvoices(response.data.content);
            setInvoicesTotalPages(response.data.totalPages || 1);
            setInvoicesTotalElements(response.data.totalElements || 0);
          } else if (Array.isArray(response.data)) {
            setInvoices(response.data);
            setInvoicesTotalPages(1);
            setInvoicesTotalElements(response.data.length);
          }
        }
      } catch (error) {
        toast.error("Failed to fetch invoices", {
          duration: 6000,
        });
        setInvoices([]);
        setInvoicesTotalPages(1);
        setInvoicesTotalElements(0);
      } finally {
        setInvoicesLoading(false);
      }
    },
    [currentHotelId, invoicesPageSize]
  );

  // Download invoice PDF
  const handleDownloadInvoice = useCallback(async (invoice) => {
    try {
      const response = await api.get(`/invoices/${invoice.id}`);
      await generateSubscriptionInvoice(response.data);
      toast.success("Invoice downloaded", {
        description: `Invoice ${invoice.invoiceNumber} downloaded successfully.`,
      });
    } catch (error) {
      toast.error("Failed to download invoice", {
        description: error.response?.data?.message || "There was an error generating the invoice. Please try again.",
      });
    }
  }, []);

  // Fetch receipts when tab is active or hotel changes
  useEffect(() => {
    if (activeTab === "billing" && currentHotelId && billingTab === "receipts") {
      fetchReceipts(receiptsPage);
    }
  }, [activeTab, currentHotelId, receiptsPage, fetchReceipts, billingTab]);

  // Fetch invoices when billing tab is active and invoices sub-tab is selected
  useEffect(() => {
    if (activeTab === "billing" && currentHotelId && billingTab === "invoices") {
      fetchInvoices(invoicesPage);
    }
  }, [activeTab, currentHotelId, invoicesPage, fetchInvoices, billingTab]);

  // Download receipt PDF
  const handleDownloadReceipt = useCallback(async (receipt) => {
    try {
      const receiptId = receipt.id;
      const receiptType = receipt.receiptType || 'BOOKING';
      
      if (!receiptId) {
        toast.error("Invalid Receipt", {
          description: "Receipt ID is missing. Cannot generate receipt.",
          duration: 6000,
        });
        return;
      }

      // Fetch receipt data by ID
      const response = await api.get(`/receipts/${receiptId}`);
      
      if (response.status === 200 && response.data) {
        // Handle array response (get first item) or direct object
        const receiptData = Array.isArray(response.data) ? response.data[0] : response.data;
        
        // Create a booking-like object for the receipt generator
        // The receipt generator needs some booking fields for backward compatibility
        const bookingData = {
          id: receiptData.bookingId || receiptId,
          bookingId: receiptData.bookingId || receiptId,
          subscriptionId: receiptData.subscriptionId,
          hotelName: receiptData.hotelName,
          hotelPhone: receiptData.hotelPhone,
          hotelEmail: receiptData.hotelEmail,
        };
        
        // Generate and download receipt with API data
        await generateBookingReceipt(bookingData, receiptData);
        
        const receiptTypeLabel = receiptType === 'SUBSCRIPTION' ? 'subscription' : 'booking';
        
        toast.success("Receipt Downloaded", {
          description: `Your ${receiptTypeLabel} receipt has been downloaded successfully.`,
          duration: 6000,
        });
      } else {
        throw new Error("No receipt data found");
      }
    } catch (error) {
      
      toast.error("Failed to Generate Receipt", {
        description: error.response?.data?.message || "There was an error generating your receipt. Please try again.",
        duration: 6000,
      });
    }
  }, []);

  // Mark leave notification as read
  const markLeaveNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      
      // Update local state
      setLeaveNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      
      // Update unread count
      setLeaveNotificationCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  // Handle notification dropdown click
  const handleNotificationClick = async () => {
    setShowNotifications((prev) => !prev);

    // Mark all as read when opening dropdown (only if there are unread notifications)
    if (!showNotifications && unreadCount > 0) {
      await markAllNotificationsAsRead();
    }
  };

  const updateHotel = (updatedHotel) => {
    setHotel(updatedHotel);
  };

  useEffect(() => {
    if (hotel) {
      setNotifyOnNewBooking(hotel.notifyOnNewBooking ?? true);
      setNotifyOnCancellation(hotel.notifyOnCancellation ?? true);
      setGstEnabled(hotel.gst ?? false);
      setHasTimeBasedEnabled(hotel.hasTimeBased ?? false);
      setHasRestaurantEnabled(hotel.hasRestaurant ?? false);
      setWalkInServiceChargeEnabled(hotel.walkInServiceCharge ?? false);
      setWalkInServiceChargePercent(
        hotel.walkInServiceChargePercent != null ? String(hotel.walkInServiceChargePercent) : ""
      );
      setWalkInServiceChargeInclusive(hotel.walkInServiceChargeInclusive ?? false);
    }
  }, [hotel?.id]);

  const saveGeneralHotelSettings = async (overrides = {}) => {
    const walkInCharge = overrides.walkInServiceCharge ?? walkInServiceChargeEnabled;
    const payload = {
      hasTimeBased: overrides.hasTimeBased ?? hasTimeBasedEnabled,
      gst: overrides.gst ?? gstEnabled,
      notifyOnNewBooking: overrides.notifyOnNewBooking ?? notifyOnNewBooking,
      notifyOnCancellation: overrides.notifyOnCancellation ?? notifyOnCancellation,
      hasRestaurant: overrides.hasRestaurant ?? hasRestaurantEnabled,
      walkInServiceCharge: walkInCharge,
      walkInServiceChargePercent: walkInCharge
        ? parseFloat(overrides.walkInServiceChargePercent ?? walkInServiceChargePercent) || 0
        : null,
      walkInServiceChargeInclusive: walkInCharge
        ? (overrides.walkInServiceChargeInclusive ?? walkInServiceChargeInclusive)
        : false,
    };
    const res = await api.put(`/hotels/${hotel.id}`, payload);
    updateHotel(res.data);
    return res.data;
  };

  const handleToggleNewBookingNotify = async (checked) => {
    setNotifyOnNewBooking(checked);
    setSavingNotifyNewBooking(true);
    try {
      await saveGeneralHotelSettings({ notifyOnNewBooking: checked });
      toast.success(checked ? "New booking alerts enabled." : "New booking alerts disabled.");
    } catch (err) {
      console.error("Notification preference update error:", err);
      setNotifyOnNewBooking(!checked);
      toast.error("Failed to update notification preference.");
    } finally {
      setSavingNotifyNewBooking(false);
    }
  };

  const handleToggleCancellationNotify = async (checked) => {
    setNotifyOnCancellation(checked);
    setSavingNotifyCancellation(true);
    try {
      await saveGeneralHotelSettings({ notifyOnCancellation: checked });
      toast.success(checked ? "Cancellation alerts enabled." : "Cancellation alerts disabled.");
    } catch (err) {
      console.error("Notification preference update error:", err);
      setNotifyOnCancellation(!checked);
      toast.error("Failed to update notification preference.");
    } finally {
      setSavingNotifyCancellation(false);
    }
  };

  const handleToggleGst = async (checked) => {
    setGstEnabled(checked);
    setSavingGst(true);
    try {
      await saveGeneralHotelSettings({ gst: checked });
      toast.success(checked ? "GST enabled." : "GST disabled.");
    } catch (err) {
      console.error("GST update error:", err);
      setGstEnabled(!checked);
      toast.error("Failed to update GST setting.");
    } finally {
      setSavingGst(false);
    }
  };

  const handleToggleHasTimeBased = async (checked) => {
    setHasTimeBasedEnabled(checked);
    setSavingHasTimeBased(true);
    try {
      await saveGeneralHotelSettings({ hasTimeBased: checked });
      toast.success(checked ? "Hourly booking enabled." : "Hourly booking disabled.");
    } catch (err) {
      console.error("Hourly booking update error:", err);
      setHasTimeBasedEnabled(!checked);
      toast.error("Failed to update hourly booking setting.");
    } finally {
      setSavingHasTimeBased(false);
    }
  };

  const handleToggleHasRestaurant = async (checked) => {
    setHasRestaurantEnabled(checked);
    setSavingHasRestaurant(true);
    try {
      await saveGeneralHotelSettings({ hasRestaurant: checked });
      toast.success(checked ? "Restaurant enabled." : "Restaurant disabled.");
    } catch (err) {
      console.error("Restaurant setting update error:", err);
      setHasRestaurantEnabled(!checked);
      toast.error("Failed to update restaurant setting.");
    } finally {
      setSavingHasRestaurant(false);
    }
  };

  const handleToggleWalkInServiceCharge = async (checked) => {
    const previousPercent = walkInServiceChargePercent;
    setWalkInServiceChargeEnabled(checked);
    setSavingWalkInServiceCharge(true);
    try {
      const updated = await saveGeneralHotelSettings({ walkInServiceCharge: checked });
      setWalkInServiceChargePercent(
        updated.walkInServiceChargePercent != null ? String(updated.walkInServiceChargePercent) : ""
      );
      setWalkInServiceChargeInclusive(updated.walkInServiceChargeInclusive ?? false);
      toast.success(checked ? "Hotel service charge enabled." : "Hotel service charge disabled.");
    } catch (err) {
      console.error("Walk-in service charge update error:", err);
      setWalkInServiceChargeEnabled(!checked);
      setWalkInServiceChargePercent(previousPercent);
      toast.error("Failed to update hotel service charge.");
    } finally {
      setSavingWalkInServiceCharge(false);
    }
  };

  const handleSaveWalkInServiceChargePercent = async () => {
    const parsed = parseFloat(walkInServiceChargePercent);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error("Enter a service charge between 0 and 100.");
      return;
    }
    setSavingWalkInServiceCharge(true);
    try {
      await saveGeneralHotelSettings({ walkInServiceCharge: true, walkInServiceChargePercent: parsed });
      toast.success("Hotel service charge percentage updated.");
    } catch (err) {
      console.error("Walk-in service charge update error:", err);
      toast.error("Failed to update hotel service charge.");
    } finally {
      setSavingWalkInServiceCharge(false);
    }
  };

  const handleChangeWalkInServiceChargeInclusive = async (inclusive) => {
    const previous = walkInServiceChargeInclusive;
    setWalkInServiceChargeInclusive(inclusive);
    setSavingWalkInServiceCharge(true);
    try {
      await saveGeneralHotelSettings({ walkInServiceCharge: true, walkInServiceChargeInclusive: inclusive });
      toast.success(
        inclusive
          ? "Service charge is now treated as included in the room price."
          : "Service charge is now added on top of the room price."
      );
    } catch (err) {
      console.error("Walk-in service charge mode update error:", err);
      setWalkInServiceChargeInclusive(previous);
      toast.error("Failed to update service charge mode.");
    } finally {
      setSavingWalkInServiceCharge(false);
    }
  };

  const handleRestaurantFormChange = (e) => {
    const { name, value } = e.target;
    if (restaurantFormErrors[name]) {
      setRestaurantFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setRestaurantForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateRestaurantForm = () => {
    const errors = {};
    const f = restaurantForm;
    if (!f.restaurantName) errors.restaurantName = "Restaurant name is required";
    if (!f.licenseNo) errors.licenseNo = "License number is required";
    if (!f.address) errors.address = "Address is required";
    if (!f.username) errors.username = "Username is required";
    if (!f.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
      errors.email = "Enter a valid email address";
    }
    if (!f.password) {
      errors.password = "Password is required";
    } else if (f.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (!f.phoneNumber) errors.phoneNumber = "Phone number is required";
    setRestaurantFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterRestaurant = async () => {
    if (!validateRestaurantForm()) return;
    setSubmittingRestaurant(true);
    try {
      const res = await api.post(`/hotels/${hotel.id}/restaurant`, restaurantForm);
      updateHotel(res.data);
      toast.success("Restaurant registered successfully.");
    } catch (err) {
      console.error("Restaurant registration error:", err);
      toast.error(err?.response?.data?.message || "Failed to register restaurant.");
    } finally {
      setSubmittingRestaurant(false);
    }
  };

  const updateBookingStatus = (id, status) => {
    setBookings(
      bookings.map((booking) =>
        booking.id === id ? { ...booking, status } : booking
      )
    );
  };

  const handleBookingSuccess = () => {
    setBookingsRefreshSignal((prev) => prev + 1);
  };

  // Handle hotel switching
  const handleHotelSwitch = async (newHotelId) => {
    try {
      setSelectedHotelId(newHotelId);
      
      // Refresh hotel data for the new hotel
      const res = await api.get(`/hotels/${newHotelId}`);
      setHotel(res.data);
      
      // Reset notifications for the new hotel
      setNotifications([]);
      setUnreadCount(0);
      
      // Subscription data will be automatically refreshed by AuthProvider when setSelectedHotelId is called
    } catch (error) {
      // Error handled silently
    }
  };

  // Handle file upload for verification documents
  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (4MB limit per file)
    const maxFileSize = 4 * 1024 * 1024; // 4MB in bytes
    if (file.size > maxFileSize) {
      setUploadErrors((prev) => ({ 
        ...prev, 
        [field]: `File size too large: ${file.name}. File must be smaller than 4MB. Please compress your file and try again.`
      }));
      return;
    }

    const fileData = {
      file: file,
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    };

    if (field === 'tradeLicense') {
      setTradeLicense(fileData);
    } else if (field === 'idProof') {
      setIdProof(fileData);
    }

    // Clear all errors when any file is selected (since at least one is required)
    setUploadErrors({});
  };

  // Handle submission of new verification documents
  const handleSubmitNewDocuments = async (e) => {
    e.preventDefault();

    // Prevent resubmission
    if (documentsSubmitted) {
      toast.error("Documents have already been submitted. Please wait for verification.");
      return;
    }

    // Validate that at least one file is selected
    if (!tradeLicense?.file && !idProof?.file) {
      setUploadErrors({ 
        tradeLicense: "Please upload at least one document",
        idProof: "Please upload at least one document"
      });
      toast.error("Please upload at least one document");
      return;
    }

    setIsUploadingFiles(true);

    try {
      // Only upload files that are actually selected
      const uploadPromises = [];
      if (tradeLicense?.file) {
        uploadPromises.push(uploadFile(tradeLicense.file, "license"));
      }
      if (idProof?.file) {
        uploadPromises.push(uploadFile(idProof.file, "idProof"));
      }

      const uploadResults = await Promise.all(uploadPromises);

      // Prepare update data
      const updateData = {};
      uploadResults.forEach((result) => {
        if (result.field === "license") {
          updateData.licenseUrl = result.url;
        } else if (result.field === "idProof") {
          updateData.idProofUrl = result.url;
        }
      });

      // Reset verification denial reason and resubmit for verification
      updateData.isVerified = false;
      updateData.verificationDenialReason = null;
      updateData.hotelResubmit = true;

      // Update hotel with new documents
      const response = await api.put(`/hotels/${currentHotelId}`, updateData);

      if (response.status === 200) {
        toast.success("Documents uploaded successfully. Your hotel is being re-verified.", {
          duration: 5000
        });
        
        // Mark documents as submitted
        setDocumentsSubmitted(true);
        
        // Refresh hotel data
        const res = await api.get(`/hotels/${currentHotelId}`);
        setHotel(res.data);
        
        // Clear file uploads
        setTradeLicense(null);
        setIdProof(null);
        setUploadErrors({});
      }
    } catch (error) {
      toast.error("Failed to upload documents", {
        description: error.response?.data?.message || "An error occurred while uploading documents.",
        duration: 6000
      });
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const formatLoginTime = (date) => {
    if (!date) return "Never";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString(undefined, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      month: "short",
      day: "numeric",
    });
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, locked: false },
    ...(roles && !roles.includes("STAFF") ? [
      { id: "booking", label: "Booking", icon: Calendar, locked: false },
      ...(roles && !roles.includes("FRONTDESK") ? [
        { id: "inventory", label: "Bookings Inventory", icon: Package, locked: true },
        {
        id: "rooms",
        label: "Room Management",
        icon: Bed,
        locked: true,
        subItems: [
          { id: "manage", label: "Manage Rooms" },
          { id: "types", label: "Room Type Config" },
        ],
      },
        ...(roles && !roles.includes("STAFF")
          ? [{ id: "staff", label: "Staff Management", icon: Users, locked: true }]
          : []),
        ...(subscriptionPlan !== 'BASIC' ? [{ id: "analytics", label: "Analytics", icon: PieChart, locked: true }] : [])
      ] : [])
    ] : []),
    ...(subscriptionPlan !== 'BASIC' ? [{ id: "leave", label: "Leave Management", icon: Clock, locked: true }] : []),
    ...(roles && !roles.includes("FRONTDESK") && !roles.includes("STAFF") ? [
      { id: "billing", label: "Billing", icon: FileText, locked: false },
      ...(hotel?.hasRestaurant ? [{ id: "restaurant", label: "Restaurant", icon: UtensilsCrossed, locked: false }] : []),
      {
        id: "hotel",
        label: "Settings",
        icon: Settings,
        locked: true,
        subItems: [
          { id: "hotelInfo", label: "Hotel Setting" },
          { id: "general", label: "General Setting" },
        ],
      }
    ] : [])
  ];

  const handleNavItemClick = (item) => {
    if (item.id === "restaurant") {
      if (hotel?.restaurantEmail) {
        const loginUrl = `https://zhimpu.dcpl.bt/login?email=${encodeURIComponent(hotel.restaurantEmail)}`;
        window.open(loginUrl, "_blank", "noopener,noreferrer");
        return;
      }
      setActiveTab("restaurant");
      return;
    }
    if (item.subItems) {
      if (activeTab === item.id) {
        setSettingsExpanded((prev) => !prev);
      } else {
        setSettingsExpanded(true);
      }
    }
    setActiveTab(item.id);
  };

  const handleNavSubItemClick = (item, subItem) => {
    if (item.id === "rooms") {
      setRoomsSubTab(subItem.id);
    } else {
      setSettingsSubTab(subItem.id);
    }
    setActiveTab(item.id);
  };

  const getPageTitle = () => {
    if (activeTab === "hotel") {
      return settingsSubTab === "general" ? "General Setting" : "Hotel Setting";
    }
    if (activeTab === "rooms" && roomsSubTab === "types") {
      return "Room Type Config";
    }
    const titles = {
      dashboard: "Dashboard",
      rooms: "Room Management",
      staff: "Staff Management",
      inventory: "Bookings Inventory",
      analytics: "Analytics & Reports",
      booking: "Booking Management",
      leave: "Leave Management",
      billing: "Billing",
      restaurant: "Restaurant",
    };
    return titles[activeTab] || "Dashboard";
  };

  const getPageDescription = () => {
    if (activeTab === "rooms" && roomsSubTab === "types") {
      return "Configure the room types available for this hotel";
    }
    const descriptions = {
      dashboard: "Overview of your hotel operations and recent activity",
      hotel: "Manage your hotel information and details",
      rooms: "Add, edit, and manage your room inventory",
      inventory: "View all bookings data in tabular format with Excel export",
      staff: "Manage your hotel staff and their roles",
      analytics: "Insights and reports about your business performance",
      booking: "Manage and view your hotel bookings",
      leave: roles?.includes("STAFF")
        ? "Request leave and view your leave history"
        : "Manage staff leave requests and approvals",
      billing: "View and download receipts for your hotel",
    };
    return descriptions[activeTab] || "Manage your hotel operations";
  };

  const NavigationButton = ({ item, onClick, isActive, onSubItemClick, activeSubTab }) => {
    const Icon = item.icon;
    const isLocked = item.locked && isSubscriptionExpired();
    const showLeaveBadge = item.id === "leave" && leaveNotificationCount > 0;
    const hasSubItems = !!item.subItems;
    const isExpanded = hasSubItems && isActive && settingsExpanded;

    return (
      <div>
        <button
          onClick={() => {
            if (isLocked) {
              toast.error("Subscription expired. Please renew to access this feature.", { duration: 4000 });
              return;
            }
            onClick();
          }}
          disabled={isLocked}
          className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] font-medium transition-colors text-left ${
            isActive
              ? "bg-neutral-100 text-neutral-950"
              : isLocked
              ? "opacity-40 cursor-not-allowed text-neutral-500"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
          }`}
        >
          <Icon className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={isActive ? 2 : 1.75} />
          <span className="flex-1 truncate">{item.label}</span>
          {isLocked && <AlertTriangle className="h-[11px] w-[11px] text-neutral-400 flex-shrink-0" />}
          {showLeaveBadge && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center font-bold">
              {leaveNotificationCount > 99 ? "99+" : leaveNotificationCount}
            </span>
          )}
          {hasSubItems && (
            <ChevronDown
              className={`h-[13px] w-[13px] flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {hasSubItems && isExpanded && !isLocked && (
          <div className="mt-0.5 ml-[27px] space-y-0.5 border-l border-neutral-100 pl-2">
            {item.subItems.map((subItem) => (
              <button
                key={subItem.id}
                onClick={() => onSubItemClick(subItem)}
                className={`w-full flex items-center px-2.5 py-[6px] rounded-md text-[12.5px] font-medium transition-colors text-left ${
                  activeSubTab === subItem.id
                    ? "bg-neutral-100 text-neutral-950"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
                }`}
              >
                <span className="truncate">{subItem.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Small reusable verified badge for inline use next to names
  const VerifiedBadge = ({ size = "md" }) => {
    const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
    const padding = "p-0.5";
    return (
      <span
        className={`inline-flex items-center justify-center bg-blue-500 rounded-full ${padding} flex-shrink-0`}
        aria-label="Verified account"
      >
        <Check className={`${iconSize} text-white`} strokeWidth={3} />
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="w-[220px] lg:w-[240px] bg-white hidden md:flex flex-col h-screen border-r border-neutral-200">
        {/* Logo + hotel context */}
        <div className="flex-shrink-0 px-4 pt-5 pb-4 border-b border-neutral-100">
          <EzeeRoomLogo size="default" />

          {hotel?.name && (
            <div className="mt-3 flex items-center gap-1.5 min-w-0">
              <span className="truncate text-[13px] font-semibold text-neutral-950" title={hotel.name}>
                {hotel.name}
              </span>
              {isTopHotel(currentHotelId) && (
                <TopHotelBadge hotelId={currentHotelId} className="flex-shrink-0" />
              )}
            </div>
          )}

          {subscriptionPlan && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 bg-neutral-950 text-white text-[12px] font-semibold px-2.5 py-1 rounded-md tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                {subscriptionPlan === 'TRIAL' ? 'Trial Plan' : subscriptionPlan === 'BASIC' ? 'Basic Plan' : 'Pro Plan'}
              </span>
            </div>
          )}
        </div>

        {/* Role label */}
        <div className="flex-shrink-0 px-4 pt-4 pb-1">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-neutral-400">
            {roles?.includes("SUPER_ADMIN") ? "Super Admin" :
             roles?.includes("HOTEL_ADMIN") ? "Admin" :
             roles?.includes("MANAGER") ? "Manager" :
             roles?.includes("FRONTDESK") ? "Front Desk" :
             roles?.includes("STAFF") ? "Staff" :
             "Admin"}
          </p>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-0.5">
            {navigationItems.map((item) => (
              <NavigationButton
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                onClick={() => handleNavItemClick(item)}
                activeSubTab={item.id === "rooms" ? roomsSubTab : settingsSubTab}
                onSubItemClick={(subItem) => handleNavSubItemClick(item, subItem)}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-neutral-100 p-3">
          <Link to="/">
            <button className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 transition-colors">
              <ArrowLeft className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={1.75} />
              Back to Website
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
          <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
            {/* Left: page title + hotel chip */}
            <div className="hidden md:flex items-center gap-3 min-w-0 flex-1">
              <h2 className="text-[16px] font-semibold tracking-tight text-neutral-950 flex-shrink-0">
                {getPageTitle()}
              </h2>

              {hotel?.name &&
                (userHotels && userHotels.length > 1 ? (
                  <Select value={currentHotelId || ""} onValueChange={handleHotelSwitch}>
                    <SelectTrigger
                      aria-label="Switch hotel"
                      className="h-7 w-auto max-w-[180px] shrink-0 gap-1 rounded border border-neutral-200 bg-neutral-50 px-3 text-[13px] font-medium text-neutral-700 shadow-none focus:ring-1 focus:ring-neutral-300"
                    >
                      <SelectValue placeholder="Select hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {userHotels.map((hotelOption) => (
                        <SelectItem key={hotelOption.id} value={hotelOption.id?.toString()}>
                          <span className="text-[13px] truncate">{hotelOption.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="inline-flex items-center gap-1 h-7 border border-neutral-200 bg-neutral-50 rounded px-3 text-[13px] font-medium text-neutral-700 max-w-[180px] truncate flex-shrink-0">
                    <span className="truncate">{hotel.name}</span>
                  </span>
                ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
              {/* Help */}
              <button
                onClick={() => navigate("/help")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 transition-colors"
              >
                <HelpCircle className="h-[15px] w-[15px]" />
                <span className="hidden sm:inline">Help</span>
              </button>

              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={handleNotificationClick}
                  disabled={loadingNotifications}
                  className="relative p-2 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 transition-colors"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-[14px] min-w-[14px] px-0.5 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}

                {showNotifications && (
                  <div className="fixed left-4 right-4 top-14 sm:absolute sm:right-0 sm:left-auto sm:top-auto sm:mt-2 w-auto sm:w-[320px] bg-white border border-neutral-200 rounded-lg z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-neutral-950">Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={deleteAllNotifications}
                          className="text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Body */}
                    <div className="max-h-[360px] overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2.5">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-neutral-200 border-t-neutral-700" />
                          <p className="text-[12px] text-neutral-500">Loading...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                            <Bell className="h-4 w-4 text-neutral-400" />
                          </div>
                          <p className="text-[12px] text-neutral-500">No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-100">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 transition-colors ${
                                notification.isRead
                                  ? "bg-white hover:bg-neutral-50"
                                  : "bg-neutral-50 hover:bg-neutral-100"
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="mt-[5px] flex-shrink-0">
                                  {!notification.isRead
                                    ? <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />
                                    : <div className="w-1.5 h-1.5" />
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-medium text-neutral-900 leading-snug mb-1.5">
                                    {notification.title}
                                  </p>
                                  <div className="space-y-0.5 mb-2">
                                    {notification.guestName && (
                                      <p className="text-[12px] text-neutral-500">
                                        <span className="font-medium text-neutral-700">Guest</span>{" "}
                                        {notification.guestName}
                                      </p>
                                    )}
                                    {notification.roomNumber && (
                                      <p className="text-[12px] text-neutral-500">
                                        <span className="font-medium text-neutral-700">Room</span>{" "}
                                        {notification.roomNumber}
                                      </p>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-neutral-400 tabular-nums">
                                    {notification.displayTime ||
                                      new Date(notification.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Navigation Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 transition-colors md:hidden">
                    <List className="h-[16px] w-[16px]" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[240px] p-0 flex flex-col h-full bg-white border-r border-neutral-200"
                >
                  {/* Logo + hotel */}
                  <div className="flex-shrink-0 px-4 pt-5 pb-4 border-b border-neutral-100">
                    <SheetHeader className="p-0 text-left">
                      <SheetTitle className="p-0">
                        <EzeeRoomLogo size="default" />
                      </SheetTitle>
                    </SheetHeader>

                    {hotel?.name && (
                      <div className="mt-3 space-y-2">
                        <span className="block text-[13px] font-semibold text-neutral-950 truncate">
                          {hotel.name}
                        </span>
                        {userHotels && userHotels.length > 1 && (
                          <Select value={currentHotelId || ""} onValueChange={handleHotelSwitch}>
                            <SelectTrigger className="w-full h-7 text-[12px] border-neutral-200 bg-neutral-50 shadow-none">
                              <SelectValue placeholder="Switch Hotel" />
                            </SelectTrigger>
                            <SelectContent>
                              {userHotels.map((hotelOption) => (
                                <SelectItem key={hotelOption.id} value={hotelOption.id?.toString()}>
                                  <span className="text-[13px] truncate">{hotelOption.name}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {subscriptionPlan && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1.5 bg-neutral-950 text-white text-[12px] font-semibold px-2.5 py-1 rounded-md tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                          {subscriptionPlan === 'TRIAL' ? 'Trial Plan' : subscriptionPlan === 'BASIC' ? 'Basic Plan' : 'Pro Plan'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Role label */}
                  <div className="flex-shrink-0 px-4 pt-4 pb-1">
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-neutral-400">
                      {roles?.includes("SUPER_ADMIN") ? "Super Admin" :
                       roles?.includes("HOTEL_ADMIN") ? "Admin" :
                       roles?.includes("MANAGER") ? "Manager" :
                       roles?.includes("FRONTDESK") ? "Front Desk" :
                       roles?.includes("STAFF") ? "Staff" : "Admin"}
                    </p>
                  </div>

                  {/* Nav */}
                  <nav className="flex-1 overflow-y-auto px-3 py-2">
                    <div className="space-y-0.5">
                      {navigationItems.map((item) => (
                        <NavigationButton
                          key={item.id}
                          item={item}
                          isActive={activeTab === item.id}
                          onClick={() => {
                            handleNavItemClick(item);
                            if (!item.subItems) {
                              setMobileMenuOpen(false);
                            }
                          }}
                          activeSubTab={item.id === "rooms" ? roomsSubTab : settingsSubTab}
                          onSubItemClick={(subItem) => {
                            handleNavSubItemClick(item, subItem);
                            setMobileMenuOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </nav>

                  {/* Footer */}
                  <div className="flex-shrink-0 border-t border-neutral-100 p-3 space-y-0.5">
                    <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-neutral-950 text-white text-[10px] font-semibold flex-shrink-0">
                        {userName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-neutral-950 truncate">{userName}</p>
                        <p className="text-[11px] text-neutral-400">
                          {roles?.includes("HOTEL_ADMIN") ? "Hotel Admin" : roles?.includes("MANAGER") ? "Manager" : "Staff"}
                        </p>
                      </div>
                    </div>

                    <Link to="/">
                      <button className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 transition-colors">
                        <ArrowLeft className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={1.75} />
                        Back to Website
                      </button>
                    </Link>

                    {!roles?.includes("STAFF") && !roles?.includes("FRONTDESK") && (
                      <Link to="/subscription">
                        <button className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 transition-colors">
                          <CreditCard className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={1.75} />
                          Subscription
                        </button>
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <div className="w-px h-4 bg-neutral-200 mx-1 hidden sm:block flex-shrink-0" />

              {/* Desktop User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center justify-center h-8 w-8 rounded-full bg-neutral-950 text-white text-[12px] font-semibold hover:opacity-80 transition-opacity flex-shrink-0">
                    {userName?.charAt(0).toUpperCase() || "U"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 sm:w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">
                        {userName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        Hotel Administrator
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/" className="w-full">
                      <Home className="mr-2 h-4 w-4" />
                      <span>Return to Website</span>
                    </Link>
                  </DropdownMenuItem>
                  {!roles?.includes("STAFF") && !roles?.includes("FRONTDESK") && !roles?.includes("MANAGER") && (
                    <DropdownMenuItem asChild>
                      <Link to="/subscription" className="w-full">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Subscription</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="py-4 sm:p-5 lg:p-6 space-y-4 bg-[#FAFAFA] min-h-full">
          {activeTab === "dashboard" && (
            <div className="space-y-4">
              {/* Subscription Expiration Notification */}
              {/* Show renewal notification if expiration date is in the future (within 7 days) */}
              {subscriptionExpirationNotification && subscriptionNextBillingDate && (
                <SubscriptionExpirationNotification 
                  nextBillingDate={subscriptionNextBillingDate}
                  subscriptionPlan={subscriptionPlan}
                  subscriptionIsActive={subscriptionIsActive}
                />
              )}

              {/* Subscription Expired Warning for Dashboard */}
              {isSubscriptionExpired() && (
                <div className="flex items-start gap-3 rounded-lg border border-neutral-200 border-l-2 border-l-neutral-950 bg-white px-4 py-3.5">
                  <Lock className="mt-0.5 h-[15px] w-[15px] flex-shrink-0 text-neutral-500" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-semibold text-neutral-950">
                      {subscriptionPlan === 'TRIAL' ? 'Trial Period Ended' : 'Subscription Expired'}
                    </h4>
                    <p className="mt-1 mb-3 text-[13px] text-neutral-500 leading-relaxed">
                      {subscriptionPlan === 'TRIAL'
                        ? 'Your trial period has ended. You cannot access some features including Room Management, Settings, Analytics, Staff Management, and Booking Inventory. Please start a subscription to restore full access.'
                        : 'Your subscription has expired. You cannot access some features including Room Management, Settings, Analytics, Staff Management, and Booking Inventory. Please renew your subscription to restore full access.'}
                    </p>
                    <Link to="/subscription">
                      <button className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-neutral-950 text-white text-[12px] font-medium hover:opacity-85 transition-opacity">
                        <CreditCard className="h-[13px] w-[13px]" />
                        {subscriptionPlan === 'TRIAL' ? 'Start Subscription' : 'Renew Subscription'}
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Verification Status Banner */}
              {hotel && !hotel.isVerified && (hotel.verificationDenialReason || hotel.hotelResubmit) && (
                <>
                  <div className="flex items-start gap-3 rounded-lg border border-neutral-200 border-l-2 border-l-red-500 bg-white px-4 py-3.5 mb-2">
                    <X className="mt-0.5 h-[15px] w-[15px] flex-shrink-0 text-red-500" />
                    <div className="flex-1">
                      <h4 className="text-[13px] font-semibold text-neutral-950 mb-1">
                        {hotel.verificationDenialReason ? 'Verification Denied' : 'Verification Required'}
                      </h4>
                      <p className="text-[13px] text-neutral-500 leading-relaxed">
                        {hotel.verificationDenialReason
                          ? <>Your hotel verification has been denied. Reason: <strong className="text-neutral-700">{hotel.verificationDenialReason}</strong></>
                          : 'Please resubmit your verification documents to continue using the platform.'}
                      </p>
                    </div>
                  </div>

                  {/* Resubmit Verification Documents */}
                  {hotel.hotelResubmit ? (
                    /* Documents Already Resubmitted */
                    <div className="flex items-start gap-3 rounded-lg border border-neutral-200 border-l-2 border-l-green-500 bg-white px-4 py-3.5 mb-2">
                      <CheckCircle className="mt-0.5 h-[15px] w-[15px] flex-shrink-0 text-green-500" />
                      <div className="flex-1">
                        <h4 className="text-[13px] font-semibold text-neutral-950 mb-1">
                          Documents Resubmitted for Verification
                        </h4>
                        <p className="text-[13px] text-neutral-500 leading-relaxed">
                          Your verification documents have been resubmitted and are pending review. We'll notify you once your hotel is verified.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-neutral-200 rounded-lg p-5 mb-2">
                      <div className="flex items-start gap-3 mb-4">
                        <Upload className="mt-0.5 h-[15px] w-[15px] flex-shrink-0 text-neutral-500" />
                        <div className="flex-1">
                          <h4 className="text-[13px] font-semibold text-neutral-950 mb-1">
                            Resubmit Verification Documents
                          </h4>
                          <p className="text-[13px] text-neutral-500 leading-relaxed">
                            Please upload the required documents again to resubmit your hotel for verification.
                          </p>
                        </div>
                      </div>

                      {documentsSubmitted ? (
                        <div className="flex items-start gap-3 rounded-lg border border-neutral-200 border-l-2 border-l-green-500 bg-white px-4 py-3.5">
                          <CheckCircle className="mt-0.5 h-[15px] w-[15px] flex-shrink-0 text-green-500" />
                          <div className="flex-1">
                            <h5 className="text-[13px] font-semibold text-neutral-950 mb-1">
                              Documents Submitted Successfully
                            </h5>
                            <p className="text-[13px] text-neutral-500">
                              Your verification documents have been submitted and are pending review. Please wait for approval before submitting again.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitNewDocuments} className="space-y-5">
                          <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3.5 py-2.5">
                            <p className="text-[12px] text-neutral-600">
                              <span className="text-red-500">*</span> At least one document is required
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Trade License */}
                            <div className="space-y-1.5">
                              <Label htmlFor="tradeLicense" className="text-[12px] font-medium text-neutral-700">
                                Trade License
                              </Label>
                              <label
                                htmlFor="tradeLicense"
                                className="flex flex-col items-center justify-center gap-2 border border-dashed border-neutral-200 rounded-md p-6 cursor-pointer hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
                              >
                                <Upload className="h-5 w-5 text-neutral-400" />
                                <span className="text-[12px] text-neutral-500 text-center">
                                  {tradeLicense ? tradeLicense.name : "Upload trade license (PDF or image)"}
                                </span>
                                <Input
                                  id="tradeLicense"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleFileUpload(e, "tradeLicense")}
                                  className="hidden"
                                  disabled={documentsSubmitted}
                                />
                              </label>
                              {uploadErrors.tradeLicense && (
                                <p className="text-[12px] text-red-500">{uploadErrors.tradeLicense}</p>
                              )}
                            </div>

                            {/* ID Proof */}
                            <div className="space-y-1.5">
                              <Label htmlFor="idProof" className="text-[12px] font-medium text-neutral-700">
                                ID Proof
                              </Label>
                              <label
                                htmlFor="idProof"
                                className="flex flex-col items-center justify-center gap-2 border border-dashed border-neutral-200 rounded-md p-6 cursor-pointer hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
                              >
                                <Upload className="h-5 w-5 text-neutral-400" />
                                <span className="text-[12px] text-neutral-500 text-center">
                                  {idProof ? idProof.name : "Upload ID proof (PDF or image)"}
                                </span>
                                <Input
                                  id="idProof"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleFileUpload(e, "idProof")}
                                  className="hidden"
                                  disabled={documentsSubmitted}
                                />
                              </label>
                              {uploadErrors.idProof && (
                                <p className="text-[12px] text-red-500">{uploadErrors.idProof}</p>
                              )}
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isUploadingFiles || documentsSubmitted}
                            className="w-full flex items-center justify-center gap-1.5 h-9 rounded-md bg-neutral-950 text-white text-[13px] font-medium hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUploadingFiles ? (
                              <><Spinner size="sm" /> Uploading Documents...</>
                            ) : (
                              <><Upload className="h-[13px] w-[13px]" /> Submit Documents for Verification</>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Welcome row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-neutral-950 flex items-center gap-2 mb-1">
                    <span className="truncate">Welcome, {userName}!</span>
                    {hotel && hotel.isVerified && <VerifiedBadge size="md" />}
                  </h3>
                  <p className="text-[13px] text-neutral-500 leading-relaxed">
                    {hotel && !hotel.isVerified && hotel.verificationDenialReason
                      ? "Your hotel verification has been denied. Please review the denial reason and resubmit your documentation."
                      : hotel && !hotel.isVerified && hotel.hotelResubmit
                      ? "Please resubmit your verification documents to continue using the platform."
                      : hotel && !hotel.isVerified && !hotel.verificationDenialReason
                      ? "Your hotel is currently pending verification."
                      : "Here's what's happening with your hotel today."}
                  </p>
                </div>

                <div className="hidden md:flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="inline-flex items-center bg-neutral-100 text-neutral-600 text-[11px] font-medium px-2 py-0.5 rounded">
                    {roles?.includes("SUPER_ADMIN") ? "Super Admin" :
                     roles?.includes("HOTEL_ADMIN") ? "Admin" :
                     roles?.includes("MANAGER") ? "Manager" :
                     roles?.includes("FRONTDESK") ? "Front Desk" :
                     roles?.includes("STAFF") ? "Staff" : "Admin"}
                  </span>
                  <p className="text-[11px] text-neutral-400 font-medium">
                    Last login: {formatLoginTime(lastLogin)}
                  </p>
                </div>
              </div>

              {/* Booking Calendar */}
              <div className="mb-6">
                <BookingCalendar hotelId={currentHotelId} />
              </div>

            </div>
          )}

          {activeTab === "rooms" && (
            <div className="space-y-4">
              {isSubscriptionExpired() ? (
                <SubscriptionLockedCard
                  title="Room Management Locked"
                  message="Please renew your subscription to manage rooms."
                />
              ) : (
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                  {roomsSubTab === "types" ? (
                    <RoomTypeManager hotelId={currentHotelId} />
                  ) : (
                    <RoomManager hotelId={currentHotelId} subscriptionPlan={subscriptionPlan} />
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="space-y-4">
              {isSubscriptionExpired() ? (
                <SubscriptionLockedCard
                  title="Booking Inventory Locked"
                  message="Please renew your subscription to view booking inventory."
                />
              ) : (
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                  <BookingsInventoryTable hotelId={currentHotelId} subscriptionPlan={subscriptionPlan} />
                </div>
              )}
            </div>
          )}

          {activeTab === "staff" && ( // Changed from "bookings" to "staff"
            <div className="space-y-4">
              {isSubscriptionExpired() ? (
                <SubscriptionLockedCard
                  title="Staff Management Locked"
                  message="Please renew your subscription to manage staff."
                />
              ) : (
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                  <StaffManager hotelId={currentHotelId} subscriptionPlan={subscriptionPlan} />
                </div>
              )}
            </div>
          )}

          {activeTab === "leave" && (
            <div className="space-y-4">
              {isSubscriptionExpired() ? (
                <SubscriptionLockedCard
                  title="Leave Management Locked"
                  message="Please renew your subscription to manage leave requests."
                />
              ) : subscriptionPlan === 'BASIC' ? (
                <SubscriptionLockedCard
                  title="Leave Management — Pro Feature"
                  message="Upgrade to Pro to manage staff leave requests and approvals."
                  upgradeRequired
                />
              ) : (
                <>
                  {/* Leave Notifications Section */}
                  {leaveNotificationCount > 0 && (
                    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-[14px] w-[14px] text-neutral-500" />
                          <h3 className="text-[13px] font-semibold text-neutral-950">Leave Notifications</h3>
                          <span className="inline-flex items-center rounded-full bg-neutral-950 px-2 py-0.5 text-[11px] font-medium text-white">
                            {leaveNotificationCount}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowLeaveNotifications(!showLeaveNotifications)}
                          className="h-7 px-3 rounded-md border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                        >
                          {showLeaveNotifications ? "Hide" : "Show"}
                        </button>
                      </div>
                      {showLeaveNotifications && (
                        <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
                          {loadingLeaveNotifications ? (
                            <div className="flex items-center justify-center py-8 gap-2.5 text-neutral-500">
                              <span className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-200 border-t-neutral-950" />
                              <span className="text-[13px]">Loading notifications…</span>
                            </div>
                          ) : (
                            leaveNotifications
                              .filter((notification) => !notification.isRead)
                              .map((notification) => (
                              <div
                                key={notification.id}
                                className="flex items-start justify-between gap-3 px-5 py-4 border-l-2 border-l-neutral-950 hover:bg-neutral-50/50 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-neutral-950 mb-0.5">
                                    {notification.title}
                                  </p>
                                  <p className="text-[12px] text-neutral-500 leading-snug">
                                    {notification.message}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-neutral-400">
                                    {notification.username && (
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {notification.username}
                                      </span>
                                    )}
                                    {notification.hotelName && (
                                      <span>{notification.hotelName}</span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(notification.createdAt).toLocaleString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => markLeaveNotificationAsRead(notification.id)}
                                  className="h-7 w-7 rounded-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 flex-shrink-0 transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <LeaveManagement hotelId={currentHotelId} />
                </>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-4">
              {isSubscriptionExpired() ? (
                <SubscriptionLockedCard
                  title="Analytics Locked"
                  message="Please renew your subscription to view analytics."
                />
              ) : subscriptionPlan === 'BASIC' ? (
                <SubscriptionLockedCard
                  title="Analytics & Reports — Pro Feature"
                  message="Upgrade to Pro to unlock booking trends, monthly performance charts, and report downloads."
                  upgradeRequired
                />
              ) : (
                <div className="space-y-4">
                  <BookingsTrendChart hotelId={currentHotelId} />
                  <MonthlyPerformanceChart hotelId={currentHotelId} />
                </div>
              )}
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-4">
              <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">

                {/* Billing subtab toggle */}
                <div className="px-5 py-4 border-b border-neutral-100">
                  <div className="flex rounded-md border border-neutral-200 overflow-hidden h-9 w-fit">
                    <button
                      onClick={() => setBillingTab("invoices")}
                      className={`flex items-center gap-1.5 px-4 text-[12px] font-medium whitespace-nowrap transition-colors ${
                        billingTab === "invoices"
                          ? "bg-neutral-950 text-white"
                          : "bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Invoices
                    </button>
                    <button
                      onClick={() => setBillingTab("receipts")}
                      className={`flex items-center gap-1.5 px-4 text-[12px] font-medium border-l border-neutral-200 whitespace-nowrap transition-colors ${
                        billingTab === "receipts"
                          ? "bg-neutral-950 text-white"
                          : "bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                      }`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Receipts
                    </button>
                  </div>
                </div>

                {/* Invoices tab */}
                {billingTab === "invoices" && (
                  invoicesLoading ? (
                    <div className="flex items-center justify-center py-12 gap-2.5 text-neutral-500">
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-neutral-200 border-t-neutral-950" />
                      <span className="text-[13px]">Loading invoices…</span>
                    </div>
                  ) : invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                        <FileText className="h-5 w-5 text-neutral-400" />
                      </div>
                      <p className="text-[13px] font-medium text-neutral-950">No invoices found</p>
                      <p className="text-[12px] text-neutral-500 mt-1">Invoices are generated when your subscription renews.</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              {["Invoice No", "Status", "Period", "Issue Date", "Due Date", "Amount", ""].map((h) => (
                                <th key={h} className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4 text-left whitespace-nowrap border-b border-neutral-100">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {invoices.map((invoice) => {
                              const statusColors = {
                                PAID:     "border-green-200 bg-green-50 text-green-700",
                                ISSUED:   "border-amber-200 bg-amber-50 text-amber-700",
                                OVERDUE:  "border-red-200 bg-red-50 text-red-700",
                                CANCELLED:"border-neutral-200 bg-neutral-50 text-neutral-500",
                              };
                              const pillClass = statusColors[invoice.status] || statusColors.ISSUED;
                              return (
                                <tr key={invoice.id} className="hover:bg-neutral-50/50">
                                  <td className="px-4 py-3 border-b border-neutral-100 font-mono text-[12px] font-medium text-neutral-950">
                                    {invoice.invoiceNumber || "—"}
                                  </td>
                                  <td className="px-4 py-3 border-b border-neutral-100">
                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${pillClass}`}>
                                      {invoice.status || "—"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-[13px] text-neutral-600 border-b border-neutral-100 whitespace-nowrap">
                                    {invoice.periodDescription || "—"}
                                  </td>
                                  <td className="px-4 py-3 text-[13px] text-neutral-700 border-b border-neutral-100 whitespace-nowrap">
                                    {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : "—"}
                                  </td>
                                  <td className="px-4 py-3 text-[13px] text-neutral-700 border-b border-neutral-100 whitespace-nowrap">
                                    {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}
                                  </td>
                                  <td className="px-4 py-3 text-[13px] text-neutral-700 border-b border-neutral-100 tabular-nums whitespace-nowrap">
                                    {invoice.totalAmount != null
                                      ? `Nu. ${parseFloat(invoice.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : "—"}
                                  </td>
                                  <td className="px-4 py-3 border-b border-neutral-100">
                                    <button
                                      onClick={() => handleDownloadInvoice(invoice)}
                                      className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      PDF
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                        {invoicesTotalPages > 1 && (
                          <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-between">
                            <p className="text-[12px] text-neutral-500">
                              {invoicesPage * invoicesPageSize + 1}–{Math.min((invoicesPage + 1) * invoicesPageSize, invoicesTotalElements)} of {invoicesTotalElements} invoices
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setInvoicesPage((prev) => Math.max(0, prev - 1))}
                                disabled={invoicesPage === 0 || invoicesLoading}
                                className="h-8 px-3 rounded-md border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-colors flex items-center gap-1"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                Previous
                              </button>
                              <span className="h-8 px-3 flex items-center text-[12px] text-neutral-500">
                                {invoicesPage + 1} / {invoicesTotalPages}
                              </span>
                              <button
                                onClick={() => setInvoicesPage((prev) => Math.min(invoicesTotalPages - 1, prev + 1))}
                                disabled={invoicesPage >= invoicesTotalPages - 1 || invoicesLoading}
                                className="h-8 px-3 rounded-md border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-colors flex items-center gap-1"
                              >
                                Next
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                  )
                )}

                {/* Receipts tab */}
                {billingTab === "receipts" && (
                  receiptsLoading ? (
                    <div className="flex items-center justify-center py-12 gap-2.5 text-neutral-500">
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-neutral-200 border-t-neutral-950" />
                      <span className="text-[13px]">Loading receipts…</span>
                    </div>
                  ) : receipts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                        <FileText className="h-5 w-5 text-neutral-400" />
                      </div>
                      <p className="text-[13px] font-medium text-neutral-950">No receipts found</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              {["Receipt Number","Type","Amount","Date","Month"].map((h) => (
                                <th key={h} className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4 text-left whitespace-nowrap border-b border-neutral-100">
                                  {h}
                                </th>
                              ))}
                              <th className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4 text-right whitespace-nowrap border-b border-neutral-100">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {receipts.map((receipt) => (
                              <tr key={receipt.id} className="hover:bg-neutral-50/50">
                                <td className="px-4 py-3 text-[12px] font-mono font-medium text-neutral-950 border-b border-neutral-100">
                                  {receipt.receiptNumber || "N/A"}
                                </td>
                                <td className="px-4 py-3 border-b border-neutral-100">
                                  <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                                    {receipt.receiptType === "SUBSCRIPTION" ? "Subscription" : "Booking"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-[13px] text-neutral-700 border-b border-neutral-100 tabular-nums">
                                  {receipt.currency || "BTN"}{" "}
                                  {parseFloat(receipt.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-[13px] text-neutral-700 border-b border-neutral-100">
                                  {receipt.issueDate
                                    ? new Date(receipt.issueDate).toLocaleDateString()
                                    : receipt.updatedAt
                                    ? new Date(receipt.updatedAt).toLocaleDateString()
                                    : "—"}
                                </td>
                                <td className="px-4 py-3 text-[13px] text-neutral-700 border-b border-neutral-100">
                                  {receipt.monthInWords || "—"}
                                </td>
                                <td className="px-4 py-3 border-b border-neutral-100 text-right">
                                  <button
                                    onClick={() => handleDownloadReceipt(receipt)}
                                    className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors ml-auto"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    Download PDF
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {receiptsTotalPages > 1 && (
                        <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-between">
                          <p className="text-[12px] text-neutral-500">
                            {receiptsPage * receiptsPageSize + 1}–{Math.min((receiptsPage + 1) * receiptsPageSize, receiptsTotalElements)} of {receiptsTotalElements} receipts
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setReceiptsPage((prev) => Math.max(0, prev - 1))}
                              disabled={receiptsPage === 0 || receiptsLoading}
                              className="h-8 px-3 rounded-md border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-colors flex items-center gap-1"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                              Previous
                            </button>
                            <span className="h-8 px-3 flex items-center text-[12px] text-neutral-500">
                              {receiptsPage + 1} / {receiptsTotalPages}
                            </span>
                            <button
                              onClick={() => setReceiptsPage((prev) => Math.min(receiptsTotalPages - 1, prev + 1))}
                              disabled={receiptsPage >= receiptsTotalPages - 1 || receiptsLoading}
                              className="h-8 px-3 rounded-md border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-colors flex items-center gap-1"
                            >
                              Next
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )
                )}

              </div>
            </div>
          )}

          {activeTab === "hotel" && (
            <div className="space-y-6">
              {isSubscriptionExpired() ? (
                <SubscriptionLockedCard
                  title="Settings Locked"
                  message="Please renew your subscription to manage hotel settings."
                />
              ) : settingsSubTab === "general" ? (
                <>
                  {/* Notification Preferences Section */}
                  <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-100">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Notifications</span>
                      <h2 className="text-[15px] font-semibold text-neutral-950 leading-none mt-0.5">Notification Preferences</h2>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-neutral-950">New Booking Alerts</p>
                          <p className="text-[12px] text-neutral-500 mt-0.5">Get notified when a guest makes a new booking.</p>
                        </div>
                        <Switch
                          checked={notifyOnNewBooking}
                          onCheckedChange={handleToggleNewBookingNotify}
                          disabled={savingNotifyNewBooking}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-neutral-950">Cancellation Alerts</p>
                          <p className="text-[12px] text-neutral-500 mt-0.5">Get notified when a guest requests a cancellation.</p>
                        </div>
                        <Switch
                          checked={notifyOnCancellation}
                          onCheckedChange={handleToggleCancellationNotify}
                          disabled={savingNotifyCancellation}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tax Settings Section */}
                  <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-100">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Billing</span>
                      <h2 className="text-[15px] font-semibold text-neutral-950 leading-none mt-0.5">Tax Settings</h2>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-neutral-950">Enable GST (5%)</p>
                        <p className="text-[12px] text-neutral-500 mt-0.5">Apply 5% GST on the base booking price. Shown as a separate line item on the booking card.</p>
                      </div>
                      <Switch
                        checked={gstEnabled}
                        onCheckedChange={handleToggleGst}
                        disabled={savingGst}
                      />
                    </div>
                  </div>

                  {/* Walk-In Service Charge Section */}
                  <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-100">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Billing</span>
                      <h2 className="text-[15px] font-semibold text-neutral-950 leading-none mt-0.5">Hotel Service Charge</h2>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-neutral-950">Enable Hotel Service Charge</p>
                        <p className="text-[12px] text-neutral-500 mt-0.5">
                          Applies only to walk-in bookings made by your staff at the front desk. The platform's service charge is waived for these bookings instead.
                        </p>
                      </div>
                      <Switch
                        checked={walkInServiceChargeEnabled}
                        onCheckedChange={handleToggleWalkInServiceCharge}
                        disabled={savingWalkInServiceCharge}
                      />
                    </div>
                    {walkInServiceChargeEnabled && (
                      <div className="px-5 py-4 border-t border-neutral-100">
                        <Label className="text-[12px] font-medium text-neutral-700 mb-1.5 block">Service Charge Percentage</Label>
                        <div className="flex items-center gap-2 max-w-[220px]">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={walkInServiceChargePercent}
                              onChange={(e) => setWalkInServiceChargePercent(e.target.value)}
                              className="pr-7 h-9 text-[13px]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-neutral-400">%</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleSaveWalkInServiceChargePercent}
                            disabled={savingWalkInServiceCharge}
                            className="h-9 px-3 rounded-md bg-neutral-950 text-white text-[12px] font-medium hover:opacity-85 transition-opacity disabled:opacity-40 flex-shrink-0"
                          >
                            Save
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1.5">
                          Calculated on the base room price. Staff can waive it for individual walk-in bookings if needed.
                        </p>
                      </div>
                    )}
                    {walkInServiceChargeEnabled && (
                      <div className="px-5 py-4 border-t border-neutral-100">
                        <Label className="text-[12px] font-medium text-neutral-700 mb-2 block">How is the service charge applied?</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleChangeWalkInServiceChargeInclusive(false)}
                            disabled={savingWalkInServiceCharge}
                            className={`text-left rounded-md border p-3 transition-colors disabled:opacity-40 ${
                              !walkInServiceChargeInclusive
                                ? "border-neutral-950 bg-neutral-50"
                                : "border-neutral-200 hover:border-neutral-300"
                            }`}
                          >
                            <p className="text-[13px] font-medium text-neutral-950">Added on top</p>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              Charge is added to the room price. The guest pays room price + service charge.
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChangeWalkInServiceChargeInclusive(true)}
                            disabled={savingWalkInServiceCharge}
                            className={`text-left rounded-md border p-3 transition-colors disabled:opacity-40 ${
                              walkInServiceChargeInclusive
                                ? "border-neutral-950 bg-neutral-50"
                                : "border-neutral-200 hover:border-neutral-300"
                            }`}
                          >
                            <p className="text-[13px] font-medium text-neutral-950">Included in room price</p>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              Charge is already inside the room price. It's only broken out on the receipt; the total is unchanged.
                            </p>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Booking Options Section */}
                  <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-100">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Booking</span>
                      <h2 className="text-[15px] font-semibold text-neutral-950 leading-none mt-0.5">Booking Options</h2>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-neutral-950">Enable Hourly Booking</p>
                        <p className="text-[12px] text-neutral-500 mt-0.5">Allow guests to book rooms for specific hours instead of full days.</p>
                      </div>
                      <Switch
                        checked={hasTimeBasedEnabled}
                        onCheckedChange={handleToggleHasTimeBased}
                        disabled={savingHasTimeBased}
                      />
                    </div>
                  </div>

                  {/* Restaurant Section */}
                  <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-100">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Restaurant</span>
                      <h2 className="text-[15px] font-semibold text-neutral-950 leading-none mt-0.5">Restaurant</h2>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-neutral-950">Has Restaurant</p>
                        <p className="text-[12px] text-neutral-500 mt-0.5">
                          {hotel?.restaurantEmail
                            ? "Connected to Zhimpu. Contact support to disconnect."
                            : "Turn this on to set up a restaurant for this hotel from the Restaurant menu."}
                        </p>
                      </div>
                      <Switch
                        checked={hasRestaurantEnabled}
                        onCheckedChange={handleToggleHasRestaurant}
                        disabled={savingHasRestaurant || !!hotel?.restaurantEmail}
                      />
                    </div>
                  </div>

                  {/* Account Management Section */}
                  <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-100">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Account</span>
                      <h2 className="text-[15px] font-semibold text-neutral-950 leading-none mt-0.5">Account Management</h2>
                    </div>

                    {/* Account info grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-neutral-100 border-b border-neutral-100">
                      <div className="px-5 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Account Holder</p>
                        <p className="text-[13px] font-medium text-neutral-950 truncate">{userName}</p>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Hotel</p>
                        <p className="text-[13px] font-medium text-neutral-950 truncate">{hotel?.name || "—"}</p>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Role</p>
                        <p className="text-[13px] font-medium text-neutral-950">
                          {roles?.includes("SUPER_ADMIN") ? "Super Admin" :
                           roles?.includes("HOTEL_ADMIN") ? "Hotel Admin" :
                           roles?.includes("MANAGER") ? "Manager" :
                           roles?.includes("FRONTDESK") ? "Front Desk" :
                           roles?.includes("STAFF") ? "Staff" :
                           "Admin"}
                        </p>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Subscription</p>
                        <p className="text-[13px] font-medium text-neutral-950">
                          {subscriptionPlan === 'TRIAL' ? 'Trial Plan' :
                           subscriptionPlan === 'BASIC' ? 'Basic Plan' :
                           subscriptionPlan === 'PREMIUM' ? 'Premium Plan' :
                           subscriptionPlan || 'No Plan'}
                        </p>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="p-5">
                      <div className="flex items-center gap-1.5 mb-3">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-red-500">Danger Zone</h4>
                      </div>
                      <div className="flex items-start justify-between gap-4 border-l-2 border-l-red-500 border border-neutral-200 bg-white px-4 py-3 rounded-r-md">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-neutral-950">Delete Account</p>
                          <p className="text-[12px] text-neutral-500 mt-0.5 leading-snug">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                          {(roles?.includes("STAFF") || roles?.includes("MANAGER") || roles?.includes("FRONTDESK")) && (
                            <p className="text-[11px] text-neutral-400 mt-1.5">Account deletion is not available for your role.</p>
                          )}
                        </div>
                        <button
                          onClick={() => navigate("/account-deletion")}
                          disabled={roles?.includes("STAFF") || roles?.includes("MANAGER") || roles?.includes("FRONTDESK")}
                          className="h-8 px-4 rounded-md bg-red-600 text-white text-[12px] font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Hotel Information Section */}
                  {hotel && (
                    <HotelInfoForm hotel={hotel} onUpdate={updateHotel} />
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "restaurant" && (
            <div className="space-y-6">
              {!hasRestaurantEnabled ? (
                <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
                  <UtensilsCrossed className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
                  <p className="text-[13px] font-medium text-neutral-950">Restaurant is not enabled</p>
                  <p className="text-[12px] text-neutral-500 mt-1">
                    Enable "Has Restaurant" under Settings → General Setting to set one up.
                  </p>
                </div>
              ) : hotel?.restaurantEmail ? (
                <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
                  <UtensilsCrossed className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                  <p className="text-[13px] font-medium text-neutral-950">Restaurant connected to Zhimpu</p>
                  <p className="text-[12px] text-neutral-500 mt-1">
                    Manage your restaurant's menu, orders, and staff from the Zhimpu dashboard.
                  </p>
                  <button
                    onClick={() =>
                      window.open(
                        `https://zhimpu.dcpl.bt/login?email=${encodeURIComponent(hotel.restaurantEmail)}`,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    className="mt-4 inline-flex items-center gap-1.5 h-8 px-4 rounded-md bg-neutral-950 text-white text-[12px] font-medium hover:opacity-85 transition-opacity"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Zhimpu Dashboard
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-100">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Restaurant</span>
                    <h2 className="text-[15px] font-semibold text-neutral-950 leading-none mt-0.5">Register with Zhimpu</h2>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[12px] font-medium text-neutral-700">
                        Restaurant Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="restaurantName"
                        value={restaurantForm.restaurantName}
                        onChange={handleRestaurantFormChange}
                        placeholder="Enter the restaurant's name"
                        className={restaurantFormErrors.restaurantName ? "border-red-400" : ""}
                      />
                      {restaurantFormErrors.restaurantName && (
                        <p className="text-red-500 text-[12px]">{restaurantFormErrors.restaurantName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[12px] font-medium text-neutral-700">
                        License Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="licenseNo"
                        value={restaurantForm.licenseNo}
                        onChange={handleRestaurantFormChange}
                        placeholder="e.g., BT-12345"
                        className={restaurantFormErrors.licenseNo ? "border-red-400" : ""}
                      />
                      {restaurantFormErrors.licenseNo && (
                        <p className="text-red-500 text-[12px]">{restaurantFormErrors.licenseNo}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[12px] font-medium text-neutral-700">
                        Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="address"
                        value={restaurantForm.address}
                        onChange={handleRestaurantFormChange}
                        placeholder="Restaurant address"
                        className={restaurantFormErrors.address ? "border-red-400" : ""}
                      />
                      {restaurantFormErrors.address && (
                        <p className="text-red-500 text-[12px]">{restaurantFormErrors.address}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[12px] font-medium text-neutral-700">
                        TPN <span className="text-neutral-400 text-[11px] font-normal">(Optional)</span>
                      </Label>
                      <Input
                        name="tpn"
                        value={restaurantForm.tpn}
                        onChange={handleRestaurantFormChange}
                        placeholder="Tax Payer Number, if any"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[12px] font-medium text-neutral-700">
                          Username <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          name="username"
                          value={restaurantForm.username}
                          onChange={handleRestaurantFormChange}
                          placeholder="Login username for Zhimpu"
                          autoComplete="off"
                          className={restaurantFormErrors.username ? "border-red-400" : ""}
                        />
                        {restaurantFormErrors.username && (
                          <p className="text-red-500 text-[12px]">{restaurantFormErrors.username}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[12px] font-medium text-neutral-700">
                          Password <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            name="password"
                            type={showRestaurantPassword ? "text" : "password"}
                            value={restaurantForm.password}
                            onChange={handleRestaurantFormChange}
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            className={`pr-9 ${restaurantFormErrors.password ? "border-red-400" : ""}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowRestaurantPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            aria-label={showRestaurantPassword ? "Hide password" : "Show password"}
                            tabIndex={-1}
                          >
                            {showRestaurantPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        {restaurantFormErrors.password && (
                          <p className="text-red-500 text-[12px]">{restaurantFormErrors.password}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[12px] font-medium text-neutral-700">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          name="email"
                          type="email"
                          value={restaurantForm.email}
                          onChange={handleRestaurantFormChange}
                          placeholder="admin@example.bt"
                          className={restaurantFormErrors.email ? "border-red-400" : ""}
                        />
                        {restaurantFormErrors.email && (
                          <p className="text-red-500 text-[12px]">{restaurantFormErrors.email}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[12px] font-medium text-neutral-700">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          name="phoneNumber"
                          type="tel"
                          value={restaurantForm.phoneNumber}
                          onChange={handleRestaurantFormChange}
                          placeholder="17123456"
                          className={restaurantFormErrors.phoneNumber ? "border-red-400" : ""}
                        />
                        {restaurantFormErrors.phoneNumber && (
                          <p className="text-red-500 text-[12px]">{restaurantFormErrors.phoneNumber}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleRegisterRestaurant}
                        disabled={submittingRestaurant}
                        className="h-9 px-4 rounded-md bg-neutral-950 text-white text-[12px] font-medium hover:opacity-85 transition-opacity disabled:opacity-40 flex items-center gap-1.5"
                      >
                        {submittingRestaurant ? <><Spinner size="sm" /> Registering...</> : "Register Restaurant"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "booking" && (
            <div className="space-y-4">
              {/* Subscription Expired Warning */}
              {isSubscriptionExpired() && (
                <div className="flex items-start gap-3 rounded-lg border border-neutral-200 border-l-2 border-l-neutral-950 bg-white px-4 py-4">
                  <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-950" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-semibold text-neutral-950">Subscription Expired</h4>
                    <p className="mt-0.5 mb-3 text-[13px] text-neutral-500 leading-relaxed">
                      Your subscription has expired. To continue creating bookings and managing your hotel,
                      please renew your subscription.
                    </p>
                    <Link to="/subscription">
                      <button className="flex items-center gap-1.5 h-8 rounded-md bg-neutral-950 px-4 text-[12px] font-medium text-white hover:opacity-85 transition-opacity">
                        <CreditCard className="h-3.5 w-3.5" />
                        Renew Subscription
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Toolbar: Create + Verify */}
              <div className="flex flex-wrap items-center gap-2">
                <AdminBookingForm
                  hotelId={currentHotelId}
                  hotelGst={hotel?.gst ?? false}
                  hotelWalkInServiceChargeEnabled={hotel?.walkInServiceCharge ?? false}
                  hotelWalkInServiceChargePercent={hotel?.walkInServiceChargePercent ?? 0}
                  hotelWalkInServiceChargeInclusive={hotel?.walkInServiceChargeInclusive ?? false}
                  onBookingSuccess={handleBookingSuccess}
                  isDisabled={isSubscriptionExpired()}
                />
                <BookingVerificationDialog
                  isDisabled={isSubscriptionExpired()}
                />
              </div>

              {/* Booking Table */}
              <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
                  <Calendar className="h-[14px] w-[14px] text-neutral-500" />
                  <h3 className="text-[13px] font-semibold text-neutral-950">All Bookings</h3>
                </div>
                <div className="overflow-x-auto" data-booking-table>
                  <BookingTable
                    hotelId={currentHotelId}
                    bookings={bookings}
                    onStatusChange={updateBookingStatus}
                    viewMode="compact"
                    refreshSignal={bookingsRefreshSignal}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HotelAdminDashboard;
