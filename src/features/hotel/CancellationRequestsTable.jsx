import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Info,
  AlertTriangle,
} from "lucide-react";

import api from "../../shared/services/Api";

// shadcn/ui components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components";
import { Badge } from "@/shared/components";
import { Button } from "@/shared/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components";
import { toast } from "sonner";

// shadcn/ui AlertDialog components for the confirmation dialog
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components";

// --- ConfirmationDialog Component ---
const ConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default", // "default" or "destructive"
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {variant === "destructive" ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle className="h-5 w-5 text-primary" />
            )}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const CancellationRequestsTable = ({ hotelId }) => {
  // WebSocket functionality removed
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState(null); // "approve" or "reject"
  const [requestToAction, setRequestToAction] = useState(null);

  const pageSize = 10; // Number of requests per page

  // --- Fetch Cancellation Requests Data ---
  const fetchCancellationRequests = async (page) => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/bookings/cancellation-requests/hotel/${hotelId}`);
      if (!res.data) {
        throw new Error("Failed to fetch cancellation requests");
      }
      const data = res.data;

      if (Array.isArray(data)) {
        setCancellationRequests(data);
        setTotalPages(Math.ceil(data.length / pageSize));
      } else {
        throw new Error("Invalid data format received");
      }
    } catch (err) {
      setError(err.message);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) fetchCancellationRequests(currentPage);
  }, [currentPage, hotelId]);

  // --- Handle Cancellation Request Actions ---
  const handleCancellationAction = async (requestId, action) => {
    setLoading(true);
    try {
      let res;
      
      if (action === "approve") {
        // Use the same API pattern as BookingTable for canceling the booking
        res = await api.put(`/bookings/${requestId}/status/CANCELLED`);
        
        // Real-time updates removed - WebSocket functionality disabled
        
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Cancellation request approved and booking cancelled successfully.
          </div>,
          {
            duration: 6000
          }
        );
      } else {
        // For reject action, use the original endpoint
        res = await api.put(`/bookings/cancellation-requests/${requestId}/reject`);
        
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Cancellation request rejected successfully.
          </div>,
          {
            duration: 6000
          }
        );
      }
      
      fetchCancellationRequests(currentPage); // Re-fetch to get updated data
    } catch (err) {
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          Failed to {action} cancellation request. Please try again.
        </div>,
        {
          duration: 6000
        }
      );
      
    } finally {
      setLoading(false);
      setActionDialog(false);
      setRequestToAction(null);
      setActionType(null);
    }
  };

  // --- Pagination Handlers ---
  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination controls
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // --- Status Badge Styling ---
  const getStatusBadge = (status) => {
    let colorClass = "bg-slate-100 text-slate-700 border border-slate-200";
    let icon = null;
    let textClass = "";
    
    switch (status) {
      case "CANCELLED":
        colorClass = "bg-red-100 text-red-800 border border-red-300 shadow-sm";
        icon = <XCircle className="h-3 w-3 mr-1" />;
        break;
      case "CANCELLATION_REJECTED":
        colorClass = "bg-orange-100 text-orange-800 border border-orange-300 shadow-sm";
        icon = <XCircle className="h-3 w-3 mr-1" />;
        textClass = "line-through";
        break;
      case "CANCELLATION_REQUESTED":
        colorClass = "bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-sm";
        icon = <AlertTriangle className="h-3 w-3 mr-1" />;
        break;
      default:
        colorClass = "bg-slate-100 text-slate-700 border border-slate-200 shadow-sm";
        icon = <Info className="h-3 w-3 mr-1" />;
    }
    
    return (
      <Badge className={`${colorClass} px-3 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center`}>
        {icon}
        <span className={textClass}>{status.replace("_", " ")}</span>
      </Badge>
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format datetime for display
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!hotelId) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        No hotel selected. Please log in as a hotel admin or select a hotel.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get paginated data
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRequests = cancellationRequests.slice(startIndex, endIndex);

  return (
    <div>
      <div>
        {/* --- Error Message Display --- */}
        {error && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
            role="alert"
          >
            <p className="font-bold">Error:</p>
            <p>{error}</p>
            <p className="text-sm mt-1">Please check your connection and try again</p>
          </div>
        )}

        {/* --- Cancellation Requests Table --- */}
        <div className="overflow-x-auto scrollbar-hide px-4 sm:px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest Info</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
                      <p>No cancellation requests found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((request) => (
                  <TableRow key={request.bookingId}>
                    <TableCell>
                      <div className="font-medium">{request.guestName}</div>
                      <div className="text-sm text-muted-foreground">
                        {request.userName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                        {request.phone || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        {formatDate(request.checkInDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        {formatDate(request.checkOutDate)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(request.bookingCreatedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Info className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {request.status !== "CANCELLATION_REJECTED" && request.status !== "CANCELLED" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setRequestToAction(request);
                                  setActionType("approve");
                                  setActionDialog(true);
                                }}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setRequestToAction(request);
                                  setActionType("reject");
                                  setActionDialog(true);
                                }}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" /> Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* --- Pagination Controls --- */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            {/* Mobile pagination */}
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage === 0}
                variant="outline"
              >
                Previous
              </Button>
              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                variant="outline"
              >
                Next
              </Button>
            </div>
            {/* Desktop pagination */}
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Showing page{" "}
                  <span className="font-medium">{currentPage + 1}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav
                  className="flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0}
                    variant="outline"
                    className="rounded-l-md rounded-r-none"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      onClick={() => handlePageClick(page)}
                      variant={page === currentPage ? "default" : "outline"}
                      className="rounded-none"
                    >
                      {page + 1}
                    </Button>
                  ))}

                  <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages - 1}
                    variant="outline"
                    className="rounded-r-md rounded-l-none"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- Action Confirmation Dialog --- */}
      <ConfirmationDialog
        open={actionDialog}
        onOpenChange={setActionDialog}
        onConfirm={() => handleCancellationAction(requestToAction?.bookingId, actionType)}
        title={`${actionType === "approve" ? "Approve" : "Reject"} Cancellation Request`}
        description={`Are you sure you want to ${actionType} the cancellation request for booking #${requestToAction?.bookingId}? This action cannot be undone.`}
        confirmText={actionType === "approve" ? "Approve" : "Reject"}
        variant={actionType === "reject" ? "destructive" : "default"}
      />

      {/* --- Request Details Modal --- */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-6">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                <Info className="h-6 w-6 text-blue-600" />
                Cancellation Request Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
              {/* Guest Information */}
              <div className="space-y-5">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-3">Guest Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-600 text-sm">Guest Name:</span>
                    <span className="text-gray-900 text-sm">{selectedRequest.guestName || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-600 text-sm">User Name:</span>
                    <span className="text-gray-900 text-sm">{selectedRequest.userName || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-600 text-sm">Phone:</span>
                    <span className="text-gray-900 text-sm">{selectedRequest.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="space-y-5">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-3">Booking Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-600 text-sm">Booking ID:</span>
                    <span className="text-gray-900 text-sm">#{selectedRequest.bookingId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-600 text-sm">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-600 text-sm">Booking Date:</span>
                    <span className="text-gray-900 text-sm">{formatDateTime(selectedRequest.bookingCreatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Travel Dates */}
              <div className="space-y-5 md:col-span-2">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-3">Travel Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-600 text-sm">Check-in Date:</span>
                    <span className="text-gray-900 text-sm">{formatDate(selectedRequest.checkInDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-600 text-sm">Check-out Date:</span>
                    <span className="text-gray-900 text-sm">{formatDate(selectedRequest.checkOutDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6">
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CancellationRequestsTable;
