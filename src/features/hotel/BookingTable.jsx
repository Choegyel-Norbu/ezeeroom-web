import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Calendar,
  Users,
  CheckCircle,
  LogIn,
  LogOut,
  Trash2,
  MoreHorizontal,
  XCircle,
  Info,
  Search,
  X,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Printer,
  CreditCard,
} from "lucide-react";

import api from "../../shared/services/Api";
import { printBookingReceipt } from "../../shared/utils/receiptPrint";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components";

// --- Helpers ---

const calculateExtensionDays = (booking) => {
  if (!booking.extension || !booking.extendedAmount) return 0;
  const originalCheckIn = new Date(booking.checkInDate);
  const originalCheckOut = new Date(booking.checkOutDate);
  const originalNights = Math.ceil((originalCheckOut - originalCheckIn) / (1000 * 60 * 60 * 24));
  const originalPricePerNight = booking.totalPrice / originalNights;
  return Math.round(booking.extendedAmount / originalPricePerNight);
};

const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

// --- Status chip ---

const STATUS_STYLES = {
  CONFIRMED:              "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING:                "bg-amber-50 text-amber-700 border-amber-200",
  CHECKED_IN:             "bg-blue-50 text-blue-700 border-blue-200",
  CHECKED_OUT:            "bg-neutral-50 text-neutral-600 border-neutral-200",
  CANCELLED:              "bg-red-50 text-red-700 border-red-200",
  APPROVED:               "bg-green-50 text-green-700 border-green-200",
  REJECTED:               "bg-red-50 text-red-700 border-red-200",
  CANCELLATION_REJECTED:  "bg-orange-50 text-orange-700 border-orange-200",
  CANCELLATION_APPROVED:  "bg-green-50 text-green-700 border-green-200",
  TRANSFERRED:            "bg-purple-50 text-purple-700 border-purple-200",
};

const StatusChip = ({ status }) => {
  const style = STATUS_STYLES[status] || "bg-neutral-50 text-neutral-600 border-neutral-200";
  const isStrike = status === "CANCELLATION_REJECTED";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${style}`}>
      <span className={isStrike ? "line-through" : ""}>{status.replace(/_/g, " ")}</span>
    </span>
  );
};

// --- Delete confirmation dialog ---

const DeleteConfirmationDialog = ({ open, onOpenChange, onConfirm, title, description }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// --- Main component ---

const BookingTable = ({ hotelId, refreshSignal }) => {
  const [bookings, setBookings] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [editingPaymentBooking, setEditingPaymentBooking] = useState(null);
  const [editPaymentMethod, setEditPaymentMethod] = useState("CASH");
  const [editJournalNumber, setEditJournalNumber] = useState("");
  const [editDiscountAmount, setEditDiscountAmount] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const pageSize = 10;

  const searchBookingsByRoom = async (roomNumber, page = 0) => {
    setSearchLoading(true);
    setError(null);
    try {
      const res = await api.get(`/bookings/search/room-number?roomNumber=${roomNumber}&hotelId=${hotelId}&page=${page}&size=${pageSize}`);
      if (!res.data) throw new Error("Failed to search bookings");
      const data = res.data;
      if (data.content) {
        setBookings(data.content);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setBookings(data);
        setTotalPages(Math.ceil(data.length / pageSize));
      }
    } catch (err) {
      setError(err.message);
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          Failed to search bookings. Please try again.
        </div>,
        { duration: 6000 }
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchBookings = async (page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/bookings/?page=${page}&size=${pageSize}&hotelId=${hotelId}`);
      if (!res.data) throw new Error("Failed to fetch bookings");
      const data = res.data;
      if (data.content) {
        setBookings(data.content);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setBookings(data);
        setTotalPages(Math.ceil(data.length / pageSize));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) {
      if (isSearchMode && lastSearchedQuery) {
        searchBookingsByRoom(lastSearchedQuery, currentPage);
      } else if (!isSearchMode) {
        fetchBookings(currentPage);
      }
    }
  }, [currentPage, hotelId, isSearchMode, lastSearchedQuery, refreshTrigger, refreshSignal]);

  const updateBookingStatus = async (id, newStatus) => {
    setLoading(true);
    try {
      const res = await api.put(`/bookings/${id}/status/${newStatus}`);
      if (res.status === 200) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Booking status updated to {newStatus.replace("_", " ")}.
          </div>,
          { duration: 6000 }
        );
      }
      if (isSearchMode && lastSearchedQuery) {
        searchBookingsByRoom(lastSearchedQuery, currentPage);
      } else {
        fetchBookings(currentPage);
      }
      setRefreshTrigger(prev => prev + 1);
    } catch {
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          Failed to update booking status. Please try again.
        </div>,
        { duration: 6000 }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancellationRequestAction = async (bookingId, action) => {
    try {
      const res = await api.put(`/bookings/cancellation-requests/${bookingId}/${action}`);
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          {res.data?.message || `Cancellation request ${action}d successfully`}
        </div>,
        { duration: 6000 }
      );
      if (isSearchMode && lastSearchedQuery) {
        searchBookingsByRoom(lastSearchedQuery, currentPage);
      } else {
        fetchBookings(currentPage);
      }
      setRefreshTrigger(prev => prev + 1);
    } catch {
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          Failed to {action} cancellation request. Please try again.
        </div>,
        { duration: 6000 }
      );
    }
  };

  const handlePrintReceipt = async (booking) => {
    try {
      const response = await api.get(`/receipts/booking/${booking.id}`);
      if (response.status === 200 && response.data && response.data.length > 0) {
        await printBookingReceipt(booking, response.data[0]);
      } else {
        toast.error("No receipt found for this booking.");
      }
    } catch {
      toast.error("Failed to print receipt.");
    }
  };

  const openPaymentEdit = (booking) => {
    setEditingPaymentBooking(booking);
    setEditPaymentMethod(booking.paymentMethod || "CASH");
    setEditJournalNumber(booking.journalNumber || "");
    setEditDiscountAmount(booking.discountAmount ? String(booking.discountAmount) : "");
  };

  const closePaymentEdit = () => {
    setEditingPaymentBooking(null);
    setEditPaymentMethod("CASH");
    setEditJournalNumber("");
    setEditDiscountAmount("");
    setIsSavingPayment(false);
  };

  const handlePaymentEditSubmit = async () => {
    if (editPaymentMethod === "BANK_TRANSFER" && !editJournalNumber.trim()) {
      toast.error("Please enter a journal number for bank transfer.");
      return;
    }

    try {
      setIsSavingPayment(true);
      await api.put(`/bookings/${editingPaymentBooking.id}/transfer-details`, null, {
        params: {
          journalNumber: editPaymentMethod === "BANK_TRANSFER" ? editJournalNumber.trim() : undefined,
          transferStatus: "DEPOSITED",
          paymentMethod: editPaymentMethod,
        },
      });

      if (editingPaymentBooking.adminBooking) {
        await api.put(`/bookings/${editingPaymentBooking.id}/discount`, null, {
          params: {
            discountAmount: parseFloat(editDiscountAmount) || 0,
          },
        });
      }

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Payment details updated successfully.
        </div>,
        { duration: 5000 }
      );

      if (isSearchMode && lastSearchedQuery) {
        searchBookingsByRoom(lastSearchedQuery, currentPage);
      } else {
        fetchBookings(currentPage);
      }
      closePaymentEdit();
    } catch (err) {
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          {err.response?.data?.message || "Failed to update payment details. Please try again."}
        </div>,
        { duration: 6000 }
      );
      setIsSavingPayment(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    setLoading(true);
    try {
      await api.delete(`/bookings/${bookingToDelete}`);
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Booking {bookingToDelete} has been removed successfully.
        </div>,
        { duration: 6000 }
      );
      if (isSearchMode && lastSearchedQuery) {
        searchBookingsByRoom(lastSearchedQuery, currentPage);
      } else {
        fetchBookings(currentPage);
      }
      setRefreshTrigger(prev => prev + 1);
    } catch {
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          Failed to delete booking. Please try again.
        </div>,
        { duration: 6000 }
      );
    } finally {
      setLoading(false);
      setDeleteDialog(false);
      setBookingToDelete(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLastSearchedQuery(searchQuery.trim());
      setIsSearchMode(true);
      setCurrentPage(0);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setLastSearchedQuery("");
    setIsSearchMode(false);
    setCurrentPage(0);
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (!e.target.value.trim()) setIsSearchMode(false);
  };

  const handlePreviousPage = () => { if (currentPage > 0) setCurrentPage(currentPage - 1); };
  const handleNextPage = () => { if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1); };
  const handlePageClick = (page) => setCurrentPage(page);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(0, endPage - maxVisiblePages + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  if (!hotelId) {
    return (
      <div className="flex justify-center items-center h-64 text-[13px] text-neutral-400">
        No hotel selected. Please log in as a hotel admin or select a hotel.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-200 border-t-neutral-950" />
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="m-5 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <form onSubmit={handleSearch}>
          <label className="block text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2">
            Search by Room Number
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[13px] w-[13px] text-neutral-400" />
              <input
                id="room-search"
                type="text"
                placeholder="Enter room number (e.g., 101, 205)"
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="w-full h-9 rounded-md border border-neutral-200 bg-white pl-9 pr-9 text-[13px] text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim() || searchLoading}
              className="flex items-center gap-1.5 h-9 px-4 rounded-md bg-neutral-950 text-white text-[13px] font-medium hover:opacity-85 transition-opacity disabled:opacity-40"
            >
              {searchLoading ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              {searchLoading ? "Searching…" : "Search"}
            </button>
          </div>
        </form>

        {isSearchMode && (
          <div className="mt-2.5 text-[12px] text-neutral-500">
            Showing results for room <span className="font-medium text-neutral-950">"{lastSearchedQuery}"</span>
            {bookings.length === 0 && !searchLoading && (
              <span className="text-amber-600 ml-2">— no bookings found</span>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mb-4 flex items-start gap-3 rounded-lg border border-neutral-200 border-l-2 border-l-red-500 bg-white px-4 py-3">
          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-neutral-950">Error loading bookings</p>
            <p className="text-[12px] text-neutral-500 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-neutral-100 hover:bg-transparent">
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Guest Info</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Phone</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Room</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Guests</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Stay Period</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Total Price</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Transfer</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Status</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-[13px] text-neutral-400">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : bookings.map((booking) => (
              <TableRow key={booking.id} className="border-b border-neutral-100 hover:bg-neutral-50/60 transition-colors">

                {/* Guest Info */}
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-neutral-950 leading-tight">
                      {booking.guestName || booking.name || 'Not provided'}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium flex-shrink-0 ${
                        booking.adminBooking
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {booking.adminBooking ? "Walk-in" : "Online"}
                    </span>
                  </div>
                  <div className="text-[12px] text-neutral-400 mt-0.5">{booking.email}</div>
                </TableCell>

                {/* Phone */}
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[13px] text-neutral-700">
                    <Phone className="h-[12px] w-[12px] text-neutral-400 flex-shrink-0" />
                    {booking.phone || "N/A"}
                  </div>
                </TableCell>

                {/* Room */}
                <TableCell className="px-4 py-3">
                  <span className="text-[13px] font-semibold text-neutral-950 tabular-nums">
                    {booking.roomNumber}
                  </span>
                </TableCell>

                {/* Guests */}
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[13px] text-neutral-700">
                    <Users className="h-[12px] w-[12px] text-neutral-400 flex-shrink-0" />
                    {booking.guests}
                  </div>
                </TableCell>

                {/* Stay Period */}
                <TableCell className="px-4 py-3">
                  <div className="text-[13px] text-neutral-950 leading-tight font-medium tabular-nums">
                    {booking.checkInDate}
                  </div>
                  <div className="text-[12px] text-neutral-400 mt-0.5 tabular-nums">
                    to {booking.checkOutDate}
                  </div>
                  {booking.timeBased && booking.checkInTime && booking.checkOutTime && (
                    <div className="text-[11px] text-blue-600 font-medium mt-1">
                      {formatTime(booking.checkInTime)} – {formatTime(booking.checkOutTime)}
                    </div>
                  )}
                  <div className="text-[11px] text-neutral-500 mt-1">
                    {booking.timeBased && booking.bookHour
                      ? `${booking.bookHour} hour${booking.bookHour !== 1 ? 's' : ''}`
                      : (() => {
                          const d = Math.ceil(Math.abs(new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / 86400000);
                          return `${d} ${d === 1 ? 'day' : 'days'}`;
                        })()
                    }
                  </div>
                  {booking.extension && calculateExtensionDays(booking) > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-[11px] w-[11px] text-emerald-600" />
                      <span className="text-[11px] text-emerald-600 font-medium">
                        +{calculateExtensionDays(booking)} day{calculateExtensionDays(booking) !== 1 ? 's' : ''} extended
                      </span>
                    </div>
                  )}
                </TableCell>

                {/* Total Price (amount actually paid: room price - discount + GST/service charge) */}
                <TableCell className="px-4 py-3">
                  <span className="text-[13px] font-semibold text-neutral-950 tabular-nums">
                    Nu. {new Intl.NumberFormat("en-IN").format(booking.txnTotalPrice ?? booking.totalPrice)}
                  </span>
                  {booking.paymentMethod && (
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      {booking.paymentMethod === "BANK_TRANSFER" ? "Bank Transfer" : "Cash"}
                    </div>
                  )}
                  {booking.paymentMethod === "BANK_TRANSFER" && booking.journalNumber && (
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Jr no: {booking.journalNumber}
                    </div>
                  )}
                </TableCell>

                {/* Transfer Status */}
                <TableCell className="px-4 py-3">
                  <StatusChip status={booking.transferStatus} />
                </TableCell>

                {/* Status */}
                <TableCell className="px-4 py-3">
                  <StatusChip status={booking.status} />
                </TableCell>

                {/* Actions */}
                <TableCell className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-7 w-7 rounded-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950 transition-colors">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-[14px] w-[14px]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                        <Info className="h-4 w-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePrintReceipt(booking)}>
                        <Printer className="h-4 w-4 mr-2" /> Print Receipt
                      </DropdownMenuItem>
                      {booking.adminBooking && (
                        <DropdownMenuItem onClick={() => openPaymentEdit(booking)}>
                          <CreditCard className="h-4 w-4 mr-2" /> Edit Payment
                        </DropdownMenuItem>
                      )}
                      {booking.status === "PENDING" && (
                        <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, "CONFIRMED")}>
                          <CheckCircle className="h-4 w-4 mr-2" /> Confirm
                        </DropdownMenuItem>
                      )}
                      {(booking.status === "CONFIRMED" || booking.status === "PENDING") && (
                        <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, "CHECKED_IN")}>
                          <LogIn className="h-4 w-4 mr-2" /> Check-in
                        </DropdownMenuItem>
                      )}
                      {booking.status === "CHECKED_IN" && (
                        <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, "CHECKED_OUT")}>
                          <LogOut className="h-4 w-4 mr-2" /> Check-out
                        </DropdownMenuItem>
                      )}
                      {booking.status === "CANCELLATION_REQUESTED" && (
                        <DropdownMenuItem onClick={() => handleCancellationRequestAction(booking.id, "approve")}>
                          <ThumbsUp className="h-4 w-4 mr-2" /> Approve
                        </DropdownMenuItem>
                      )}
                      {booking.status === "CANCELLATION_REQUESTED" && (
                        <DropdownMenuItem onClick={() => handleCancellationRequestAction(booking.id, "reject")}>
                          <ThumbsDown className="h-4 w-4 mr-2" /> Reject
                        </DropdownMenuItem>
                      )}
                      {booking.transactionStatus !== "PAID" && !booking.extension && (
                        <DropdownMenuItem
                          onClick={() => { setBookingToDelete(booking.id); setDeleteDialog(true); }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100">
        <p className="text-[12px] text-neutral-400">
          {isSearchMode ? (
            <>Results for room <span className="font-medium text-neutral-700">"{lastSearchedQuery}"</span> — page <span className="font-medium text-neutral-700">{currentPage + 1}</span> of <span className="font-medium text-neutral-700">{totalPages}</span></>
          ) : (
            <>Page <span className="font-medium text-neutral-700">{currentPage + 1}</span> of <span className="font-medium text-neutral-700">{totalPages}</span></>
          )}
        </p>
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`h-7 min-w-[28px] px-2 rounded-md text-[12px] font-medium border transition-colors ${
                page === currentPage
                  ? "bg-neutral-950 text-white border-neutral-950"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
              }`}
            >
              {page + 1}
            </button>
          ))}
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      </div>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        onConfirm={handleDeleteBooking}
        title="Confirm Deletion"
        description={`Are you sure you want to delete booking ID ${bookingToDelete}? This action cannot be undone.`}
      />

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200 shadow-none rounded-lg p-0 gap-0">
            <DialogHeader className="px-7 pt-7 pb-5 border-b border-neutral-100">
              <DialogTitle className="flex items-center gap-2 text-[16px] font-semibold text-neutral-950 tracking-tight">
                <Calendar className="h-4 w-4 text-neutral-500" />
                Booking Details
              </DialogTitle>
            </DialogHeader>

            <div className="px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Guest Information */}
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-4">Guest Information</p>
                <div className="space-y-3">
                  {[
                    ["Name", selectedBooking.guestName || selectedBooking.name || 'Not provided'],
                    ["Email", selectedBooking.email || 'Not provided'],
                    ["Phone", selectedBooking.phone ? `+975 ${selectedBooking.phone}` : 'Not provided'],
                    [
                      selectedBooking.passportNumber ? "Passport" : "CID",
                      selectedBooking.cid || selectedBooking.passportNumber || 'Not provided',
                    ],
                    ["Payment Method", selectedBooking.paymentMethod === "BANK_TRANSFER" ? "Bank Transfer" : selectedBooking.paymentMethod === "CASH" ? "Cash" : 'Not provided'],
                    ...(selectedBooking.paymentMethod === "BANK_TRANSFER"
                      ? [["Journal No.", selectedBooking.journalNumber || 'Not provided']]
                      : []),
                    ["Guests", selectedBooking.guests],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <span className="text-[12px] text-neutral-400 flex-shrink-0">{label}</span>
                      <span className="text-[13px] font-medium text-neutral-950 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Travel Information */}
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-4">Travel Information</p>
                <div className="space-y-3">
                  {[
                    ["Origin", selectedBooking.origin || 'Not provided'],
                    ["Destination", selectedBooking.destination || 'Not provided'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <span className="text-[12px] text-neutral-400 flex-shrink-0">{label}</span>
                      <span className="text-[13px] font-medium text-neutral-950 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Details */}
              <div className="md:col-span-2">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-4">Booking Details</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-neutral-400">Room</span>
                    <span className="text-[13px] font-semibold text-neutral-950 tabular-nums">{selectedBooking.roomNumber}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-neutral-400">Check-in</span>
                    <span className="text-[13px] font-medium text-neutral-950 tabular-nums text-right">
                      {selectedBooking.checkInDate}
                      {selectedBooking.timeBased && selectedBooking.checkInTime && (
                        <span className="ml-1.5 text-[11px] text-blue-600">at {formatTime(selectedBooking.checkInTime)}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-neutral-400">Check-out</span>
                    <span className="text-[13px] font-medium text-neutral-950 tabular-nums text-right">
                      {selectedBooking.checkOutDate}
                      {selectedBooking.timeBased && selectedBooking.checkOutTime && (
                        <span className="ml-1.5 text-[11px] text-blue-600">at {formatTime(selectedBooking.checkOutTime)}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-neutral-400">Duration</span>
                    <div className="flex flex-col items-end">
                      <span className="text-[13px] font-semibold text-neutral-950">
                        {selectedBooking.timeBased && selectedBooking.bookHour
                          ? `${selectedBooking.bookHour} hour${selectedBooking.bookHour !== 1 ? 's' : ''}`
                          : (() => {
                              const d = Math.ceil(Math.abs(new Date(selectedBooking.checkOutDate) - new Date(selectedBooking.checkInDate)) / 86400000);
                              return `${d} ${d === 1 ? 'day' : 'days'}`;
                            })()
                        }
                      </span>
                      {selectedBooking.extension && calculateExtensionDays(selectedBooking) > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <TrendingUp className="h-[11px] w-[11px] text-emerald-600" />
                          <span className="text-[11px] text-emerald-600 font-medium">
                            +{calculateExtensionDays(selectedBooking)} day{calculateExtensionDays(selectedBooking) !== 1 ? 's' : ''} extended
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-neutral-400">Status</span>
                    <StatusChip status={selectedBooking.status} />
                  </div>

                  {selectedBooking.extension && selectedBooking.extendedAmount ? (
                    <div className="md:col-span-3 bg-neutral-50 rounded-lg border border-neutral-200 p-4 space-y-2.5">
                      <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-1">Pricing Breakdown</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-neutral-500">Original booking</span>
                        <span className="text-[13px] font-medium text-neutral-950 tabular-nums">
                          Nu. {new Intl.NumberFormat("en-IN").format(selectedBooking.totalPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-emerald-600">Extension fee</span>
                        <span className="text-[13px] font-medium text-emerald-700 tabular-nums">
                          +Nu. {new Intl.NumberFormat("en-IN").format(selectedBooking.extendedAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-neutral-200 pt-2.5">
                        <span className="text-[13px] font-semibold text-neutral-950">Total</span>
                        <span className="text-[15px] font-bold text-neutral-950 tabular-nums">
                          Nu. {new Intl.NumberFormat("en-IN").format(selectedBooking.totalPrice + selectedBooking.extendedAmount)}
                        </span>
                      </div>
                    </div>
                  ) : (selectedBooking.discountAmount > 0 || selectedBooking.walkInServiceChargeAmount > 0
                        || selectedBooking.gstAmount > 0 || selectedBooking.serviceTaxAmount > 0) ? (
                    <div className="md:col-span-3 bg-neutral-50 rounded-lg border border-neutral-200 p-4 space-y-2.5">
                      <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-1">Pricing Breakdown</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-neutral-500">Room Price</span>
                        <span className="text-[13px] font-medium text-neutral-950 tabular-nums">
                          Nu. {new Intl.NumberFormat("en-IN").format(selectedBooking.totalPrice)}
                        </span>
                      </div>
                      {selectedBooking.walkInServiceChargeAmount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-neutral-500">
                            Service Charge{selectedBooking.walkInServiceChargeRate ? ` (${Math.round(selectedBooking.walkInServiceChargeRate * 100)}%)` : ''}
                          </span>
                          <span className="text-[13px] font-medium text-neutral-950 tabular-nums">
                            +Nu. {new Intl.NumberFormat("en-IN").format(selectedBooking.walkInServiceChargeAmount)}
                          </span>
                        </div>
                      )}
                      {selectedBooking.gstAmount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-neutral-500">
                            GST{selectedBooking.gstRate ? ` (${Math.round(selectedBooking.gstRate * 100)}%)` : ''}
                          </span>
                          <span className="text-[13px] font-medium text-neutral-950 tabular-nums">
                            +Nu. {new Intl.NumberFormat("en-IN").format(selectedBooking.gstAmount)}
                          </span>
                        </div>
                      )}
                      {selectedBooking.serviceTaxAmount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-neutral-500">
                            Service Tax{selectedBooking.serviceTaxRate ? ` (${Math.round(selectedBooking.serviceTaxRate * 100)}%)` : ''}
                          </span>
                          <span className="text-[13px] font-medium text-neutral-950 tabular-nums">
                            +Nu. {new Intl.NumberFormat("en-IN").format(selectedBooking.serviceTaxAmount)}
                          </span>
                        </div>
                      )}
                      {selectedBooking.discountAmount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-red-600">Discount</span>
                          <span className="text-[13px] font-medium text-red-600 tabular-nums">
                            -Nu. {new Intl.NumberFormat("en-IN").format(selectedBooking.discountAmount)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-neutral-200 pt-2.5">
                        <span className="text-[13px] font-semibold text-neutral-950">Total Price</span>
                        <span className="text-[15px] font-bold text-neutral-950 tabular-nums">
                          Nu. {new Intl.NumberFormat("en-IN").format(selectedBooking.txnTotalPrice ?? selectedBooking.totalPrice)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[12px] text-neutral-400">Total Price</span>
                      <span className="text-[14px] font-bold text-neutral-950 tabular-nums">
                        Nu. {new Intl.NumberFormat("en-IN").format(selectedBooking.txnTotalPrice ?? selectedBooking.totalPrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="px-7 pb-7 border-t border-neutral-100 pt-5">
              <button
                onClick={() => setSelectedBooking(null)}
                className="h-9 px-5 rounded-md border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
              >
                Close
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Payment Dialog */}
      {editingPaymentBooking && (
        <Dialog open={!!editingPaymentBooking} onOpenChange={(open) => !open && closePaymentEdit()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Payment</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="editPaymentMethod">Payment Method</Label>
                <Select
                  value={editPaymentMethod}
                  onValueChange={(value) => {
                    setEditPaymentMethod(value);
                    if (value !== "BANK_TRANSFER") setEditJournalNumber("");
                  }}
                >
                  <SelectTrigger id="editPaymentMethod">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editPaymentMethod === "BANK_TRANSFER" && (
                <div className="grid gap-2">
                  <Label htmlFor="editJournalNumber">Journal Number</Label>
                  <Input
                    id="editJournalNumber"
                    type="text"
                    value={editJournalNumber}
                    onChange={(e) => setEditJournalNumber(e.target.value)}
                    placeholder="Enter journal number"
                    maxLength={50}
                    autoFocus
                  />
                </div>
              )}

              {editingPaymentBooking.adminBooking && (
                <div className="grid gap-2">
                  <Label htmlFor="editDiscountAmount">Discount (Nu.)</Label>
                  <Input
                    id="editDiscountAmount"
                    type="number"
                    min="0"
                    step="1"
                    value={editDiscountAmount}
                    onChange={(e) => setEditDiscountAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closePaymentEdit} disabled={isSavingPayment}>
                Cancel
              </Button>
              <Button
                onClick={handlePaymentEditSubmit}
                disabled={isSavingPayment || (editPaymentMethod === "BANK_TRANSFER" && !editJournalNumber.trim())}
              >
                {isSavingPayment ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BookingTable;
