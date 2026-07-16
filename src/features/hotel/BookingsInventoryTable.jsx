import React, { useState, useEffect } from "react";
import {
  Download, Search, Calendar, FileText,
  ChevronLeft, ChevronRight, X, Users, Crown,
} from "lucide-react";
import ProUpgradeDialog from "@/shared/components/ProUpgradeDialog";
import * as XLSX from "xlsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/table";
import api from "../../shared/services/Api";
import { toast } from "sonner";

// --- Status chip styles ---
const BOOKING_STATUS_STYLES = {
  CONFIRMED:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  CHECKED_IN:   "bg-blue-50 text-blue-700 border-blue-200",
  CHECKED_OUT:  "bg-neutral-50 text-neutral-600 border-neutral-200",
  CANCELLED:    "bg-red-50 text-red-700 border-red-200",
  COMPLETED:    "bg-neutral-50 text-neutral-600 border-neutral-200",
  PENDING:      "bg-amber-50 text-amber-700 border-amber-200",
};

const TRANSFER_STATUS_STYLES = {
  TRANSFERRED:  "bg-purple-50 text-purple-700 border-purple-200",
  PENDING:      "bg-amber-50 text-amber-700 border-amber-200",
  FAILED:       "bg-red-50 text-red-700 border-red-200",
};

const StatusChip = ({ status, styleMap }) => {
  const style = (styleMap && styleMap[status?.toUpperCase()]) || "bg-neutral-50 text-neutral-600 border-neutral-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${style}`}>
      {status || "N/A"}
    </span>
  );
};

// --- Helpers ---
const formatCurrency = (amount) =>
  `Nu. ${new Intl.NumberFormat("en-IN").format(amount ?? 0)}`;

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

const SEARCH_OPTIONS = [
  { value: "all",      label: "All Bookings" },
  { value: "cid",      label: "Search by CID" },
  { value: "phone",    label: "Search by Phone" },
  { value: "checkin",  label: "Search by Check-in" },
  { value: "checkout", label: "Search by Check-out" },
];

const PLACEHOLDERS = {
  cid:      "Enter CID number…",
  phone:    "Enter phone number…",
  checkin:  "YYYY-MM-DD",
  checkout: "YYYY-MM-DD",
  all:      "Select a search type first",
};

// --- Component ---
const BookingsInventoryTable = ({ hotelId, subscriptionPlan }) => {
  const [bookings, setBookings]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState("");
  const [searchOption, setSearchOption]     = useState("all");
  const [currentPage, setCurrentPage]       = useState(0);
  const [totalPages, setTotalPages]         = useState(1);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  const pageSize = 10;

  const buildUrl = (page, searchParams = {}) => {
    const baseParams = `page=${page}&size=${pageSize}&hotelId=${hotelId}`;
    const { searchOption: opt, searchTerm: term } = searchParams;
    if (opt && term) {
      switch (opt) {
        case "cid":      return `/bookings/search/cid?cid=${encodeURIComponent(term)}&${baseParams}`;
        case "phone":    return `/bookings/search/phone?phone=${encodeURIComponent(term)}&${baseParams}`;
        case "checkin":  return `/bookings/search/checkin-date?checkInDate=${encodeURIComponent(term)}&${baseParams}`;
        case "checkout": return `/bookings/search/checkout-date?checkOutDate=${encodeURIComponent(term)}&${baseParams}`;
      }
    }
    return `/bookings/?${baseParams}`;
  };

  const fetchBookings = async (page, searchParams = {}) => {
    if (!hotelId) return;
    try {
      setLoading(true);
      const response = await api.get(buildUrl(page, searchParams));
      if (response.data?.content) {
        setBookings(response.data.content);
        setTotalPages(response.data.totalPages || 1);
        setTotalElements(response.data.totalElements || 0);
      } else if (Array.isArray(response.data)) {
        setBookings(response.data);
        setTotalPages(Math.ceil(response.data.length / pageSize));
        setTotalElements(response.data.length);
      }
    } catch {
      toast.error("Failed to fetch bookings data");
      setBookings([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const getSearchParams = () =>
    searchTerm && searchOption !== "all" ? { searchOption, searchTerm } : {};

  useEffect(() => {
    fetchBookings(currentPage, searchTerm ? getSearchParams() : {});
  }, [hotelId, currentPage]);

  const handleSearch = () => {
    setCurrentPage(0);
    fetchBookings(0, searchTerm ? getSearchParams() : {});
  };

  const handleKeyPress = (e) => { if (e.key === "Enter") handleSearch(); };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchOption("all");
    setCurrentPage(0);
    fetchBookings(0);
  };

  const exportToExcel = async () => {
    if (subscriptionPlan !== 'PRO') { setShowUpgradeDialog(true); return; }
    if (totalElements === 0) { toast.warning("No data to export"); return; }
    const loadingToast = toast.loading("Preparing Excel export…");
    try {
      let allBookings = [];
      const url = buildUrl(0, { ...getSearchParams(), size: totalElements })
        .replace(`size=${pageSize}`, `size=${totalElements}`);
      const response = await api.get(buildUrl(0, { searchOption: getSearchParams().searchOption, searchTerm: getSearchParams().searchTerm })
        .replace(`size=${pageSize}`, `size=${totalElements}`));
      allBookings = response.data?.content || (Array.isArray(response.data) ? response.data : bookings);

      const excelData = allBookings.map((b) => ({
        ID: b.id,
        "Guest Name": b.name,
        Phone: b.phone,
        Email: b.email,
        CID: b.cid,
        Passport: b.passportNumber,
        "Room Number": b.roomNumber,
        Passcode: b.passcode,
        "Check-In Date": b.checkInDate,
        "Check-Out Date": b.checkOutDate,
        Guests: b.guests,
        Status: b.status,
        "Transfer Status": b.transferStatus || "N/A",
        "Payment Method": b.paymentMethod || "N/A",
        "Journal Number": b.journalNumber || "N/A",
        "Total Price": b.txnTotalPrice ?? b.totalPrice,
        Origin: b.origin,
        Destination: b.destination,
        "Hotel Name": b.hotelName,
        "Hotel District": b.hotelDistrict,
        "Created At": new Date(b.createdAt).toLocaleString(),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      ws["!cols"] = [8,20,15,25,15,12,10,12,12,8,12,15,12,15,15,20,15,20].map(wch => ({ wch }));
      XLSX.utils.book_append_sheet(wb, ws, "Bookings");
      XLSX.writeFile(wb, `Hotel_Bookings_${new Date().toISOString().split("T")[0]}.xlsx`);

      toast.dismiss(loadingToast);
      toast.success(`Exported ${allBookings.length} bookings to Excel`, { duration: 6000 });
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Failed to export data to Excel");
    }
  };

  const handlePreviousPage = () => { if (currentPage > 0) setCurrentPage(currentPage - 1); };
  const handleNextPage = () => { if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1); };

  const getPageNumbers = () => {
    const max = 5;
    let start = Math.max(0, currentPage - Math.floor(max / 2));
    let end   = Math.min(totalPages - 1, start + max - 1);
    if (end - start + 1 < max) start = Math.max(0, end - max + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2.5 text-neutral-500">
        <span className="w-5 h-5 rounded-full border-2 border-neutral-200 border-t-neutral-950 animate-spin" />
        <span className="text-[13px]">Loading bookings…</span>
      </div>
    );
  }

  return (
    <div>
      {/* ── Upgrade to Pro dialog ── */}
      <ProUpgradeDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} />

      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-[14px] w-[14px] text-neutral-500" />
          <h3 className="text-[13px] font-semibold text-neutral-950">Bookings Inventory</h3>
          {totalElements > 0 && (
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
              {totalElements}
            </span>
          )}
        </div>
        <button
          onClick={exportToExcel}
          disabled={totalElements === 0 && subscriptionPlan === 'PRO'}
          className={`flex items-center gap-1.5 h-8 px-3.5 rounded-md border text-[12px] font-medium transition-colors
            ${subscriptionPlan !== 'PRO'
              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 disabled:opacity-40'
            }`}
        >
          {subscriptionPlan !== 'PRO' ? (
            <Crown className="h-3.5 w-3.5" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Export Excel
        </button>
      </div>

      {/* ── Search bar ── */}
      <div className="px-5 py-4 border-b border-neutral-100 flex flex-col sm:flex-row gap-2.5">
        <Select value={searchOption} onValueChange={(v) => { setSearchOption(v); if (v === "all") clearSearch(); }}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 text-[13px] border-neutral-200 bg-neutral-50 shadow-none">
            <SelectValue placeholder="Search by…" />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {searchOption !== "all" && (
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[13px] w-[13px] text-neutral-400" />
              <input
                type={searchOption === "checkin" || searchOption === "checkout" ? "date" : "text"}
                placeholder={PLACEHOLDERS[searchOption]}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-9 rounded-md border border-neutral-200 bg-neutral-50 pl-9 pr-9 text-[13px] text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchTerm.trim()}
              className="flex items-center gap-1.5 h-9 px-4 rounded-md bg-neutral-950 text-white text-[13px] font-medium hover:opacity-85 transition-opacity disabled:opacity-40"
            >
              <Search className="h-3.5 w-3.5" />
              Search
            </button>
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
            <Calendar className="h-5 w-5 text-neutral-400" />
          </div>
          <p className="text-[13px] font-medium text-neutral-950 mb-1">No bookings found</p>
          <p className="text-[12px] text-neutral-400 max-w-xs">
            {searchTerm
              ? "Try adjusting your search criteria."
              : "There are no bookings for this hotel yet."}
          </p>
        </div>
      ) : (
        <>
          {/* ── Table ── */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-neutral-100 hover:bg-transparent">
                  {["CID / Passport", "Guest Details", "Room", "Stay Period", "Guests", "Status", "Transfer", "Price", "Travel Info", "Booked On"].map((h) => (
                    <TableHead key={h} className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4 whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} className="border-b border-neutral-100 hover:bg-neutral-50/60 transition-colors">

                    {/* CID / Passport */}
                    <TableCell className="px-4 py-3">
                      <span className="text-[13px] font-medium text-neutral-950 font-mono tabular-nums">
                        {booking.cid || booking.passportNumber || <span className="text-neutral-300 font-sans">—</span>}
                      </span>
                      {!booking.cid && booking.passportNumber && (
                        <div className="text-[10px] text-neutral-400 font-sans mt-0.5">Passport</div>
                      )}
                    </TableCell>

                    {/* Guest Details */}
                    <TableCell className="px-4 py-3 min-w-[160px]">
                      <div className="text-[13px] font-medium text-neutral-950 leading-tight">
                        {booking.guestName || booking.name}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">{booking.email}</div>
                      <div className="text-[11px] text-neutral-400">{booking.phone}</div>
                    </TableCell>

                    {/* Room */}
                    <TableCell className="px-4 py-3">
                      <span className="text-[13px] font-semibold text-neutral-950 tabular-nums">
                        {booking.roomNumber}
                      </span>
                    </TableCell>

                    {/* Stay Period */}
                    <TableCell className="px-4 py-3 min-w-[140px]">
                      <div className="space-y-1">
                        <div>
                          <div className="text-[10px] text-neutral-400 uppercase tracking-wide">Check-in</div>
                          <div className="text-[12px] font-medium text-neutral-950 tabular-nums">{formatDate(booking.checkInDate)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 uppercase tracking-wide">Check-out</div>
                          <div className="text-[12px] font-medium text-neutral-950 tabular-nums">{formatDate(booking.checkOutDate)}</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Guests */}
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[13px] text-neutral-700">
                        <Users className="h-[12px] w-[12px] text-neutral-400" />
                        {booking.guests}
                      </div>
                    </TableCell>

                    {/* Booking Status */}
                    <TableCell className="px-4 py-3">
                      <StatusChip status={booking.status} styleMap={BOOKING_STATUS_STYLES} />
                    </TableCell>

                    {/* Transfer Status */}
                    <TableCell className="px-4 py-3">
                      <div className="space-y-1">
                        <StatusChip status={booking.transferStatus} styleMap={TRANSFER_STATUS_STYLES} />
                        {booking.paymentMethod && (
                          <div className="text-[11px] text-neutral-500">
                            {booking.paymentMethod === "BANK_TRANSFER" ? "Bank Transfer" : "Cash"}
                          </div>
                        )}
                        {booking.paymentMethod === "BANK_TRANSFER" && booking.journalNumber && (
                          <div className="text-[11px] text-neutral-400">#{booking.journalNumber}</div>
                        )}
                      </div>
                    </TableCell>

                    {/* Price — amount the guest actually pays (room - discount + GST/service charge) */}
                    <TableCell className="px-4 py-3">
                      <span className="text-[13px] font-semibold text-neutral-950 tabular-nums whitespace-nowrap">
                        {formatCurrency(booking.txnTotalPrice ?? booking.totalPrice)}
                      </span>
                    </TableCell>

                    {/* Travel Info */}
                    <TableCell className="px-4 py-3 min-w-[130px]">
                      {booking.origin || booking.destination ? (
                        <div className="space-y-1">
                          {booking.origin && (
                            <div className="text-[12px] text-neutral-700">
                              <span className="text-[10px] text-neutral-400 uppercase tracking-wide block">From</span>
                              {booking.origin}
                            </div>
                          )}
                          {booking.destination && (
                            <div className="text-[12px] text-neutral-700">
                              <span className="text-[10px] text-neutral-400 uppercase tracking-wide block">To</span>
                              {booking.destination}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-300 text-[13px]">—</span>
                      )}
                    </TableCell>

                    {/* Created At */}
                    <TableCell className="px-4 py-3">
                      <span className="text-[12px] text-neutral-500 tabular-nums whitespace-nowrap">
                        {formatDate(booking.createdAt)}
                      </span>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ── Footer: summary + pagination ── */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100">
            <p className="text-[12px] text-neutral-400">
              Showing{" "}
              <span className="font-medium text-neutral-700">{bookings.length}</span>{" "}
              of{" "}
              <span className="font-medium text-neutral-700">{totalElements}</span>{" "}
              bookings
              {searchTerm && <span className="ml-1 text-neutral-400">(filtered)</span>}
            </p>

            {totalPages > 1 && (
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
                    onClick={() => setCurrentPage(page)}
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
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BookingsInventoryTable;
