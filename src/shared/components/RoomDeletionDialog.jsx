import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/dialog';
import { roomDeletionService } from '../services/roomDeletionService';

const RoomDeletionDialog = ({ isOpen, onClose, room, onDeleteSuccess }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && room) {
      setDeletionStatus(null);
      setError(null);
      checkDeletionStatus();
    } else {
      setDeletionStatus(null);
      setError(null);
    }
  }, [isOpen, room]);

  const checkDeletionStatus = async () => {
    if (!room?.id) return;
    setIsChecking(true);
    setError(null);
    try {
      const result = await roomDeletionService.checkDeletionStatus(room.id);
      if (result.success) {
        setDeletionStatus(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Failed to check room deletion status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleDelete = async () => {
    if (!room?.id || !deletionStatus?.canDelete) return;
    setIsDeleting(true);
    try {
      const result = await roomDeletionService.deleteRoom(room.id);
      if (result.success) {
        toast.success(`Room ${room.roomNumber} deleted successfully!`, { duration: 6000 });
        onDeleteSuccess(room.id);
        onClose();
      } else {
        toast.error(result.error || 'Failed to delete room', { duration: 6000 });
      }
    } catch {
      toast.error('An unexpected error occurred while deleting the room', { duration: 6000 });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isChecking && !isDeleting) onClose();
  };

  if (!room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm border border-neutral-200 shadow-none rounded-lg p-0 gap-0">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-600 font-mono">
              Room {room.roomNumber}
            </span>
          </div>
          <DialogTitle className="text-[15px] font-semibold text-neutral-950 tracking-tight">
            Delete this room?
          </DialogTitle>
          <DialogDescription className="text-[12px] text-neutral-400 mt-0.5">
            {isChecking
              ? "Checking if this room can be safely deleted…"
              : deletionStatus?.canDelete
              ? "This room has no active bookings and can be removed."
              : deletionStatus
              ? "This room cannot be deleted right now."
              : "Verifying room status before deletion."}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Checking */}
          {isChecking && (
            <div className="flex items-center gap-2.5 text-neutral-500">
              <span className="w-4 h-4 rounded-full border-2 border-neutral-200 border-t-neutral-950 animate-spin flex-shrink-0" />
              <span className="text-[13px]">Checking room status…</span>
            </div>
          )}

          {/* Error */}
          {error && !isChecking && (
            <div className="flex items-start gap-3 rounded-lg border border-neutral-200 border-l-2 border-l-red-500 bg-white px-4 py-3">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-neutral-950">Check failed</p>
                <p className="text-[12px] text-neutral-500 mt-0.5 leading-snug">{error}</p>
                <button
                  onClick={checkDeletionStatus}
                  className="mt-2 text-[12px] font-medium text-neutral-950 underline underline-offset-2 hover:no-underline transition-all"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Safe to delete */}
          {deletionStatus?.canDelete && !isChecking && (
            <div className="flex items-start gap-3 rounded-lg border border-neutral-200 border-l-2 border-l-emerald-500 bg-white px-4 py-3">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-neutral-950">Safe to delete</p>
                <p className="text-[12px] text-neutral-500 mt-0.5 leading-snug">
                  {deletionStatus.message || "No active bookings found for this room."}
                </p>
              </div>
            </div>
          )}

          {/* Cannot delete */}
          {deletionStatus && !deletionStatus.canDelete && !isChecking && (
            <div className="flex items-start gap-3 rounded-lg border border-neutral-200 border-l-2 border-l-red-500 bg-white px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-neutral-950">Cannot delete room</p>
                <p className="text-[12px] text-neutral-500 mt-0.5 leading-snug">
                  This room has{" "}
                  <span className="font-medium text-neutral-950">
                    {deletionStatus.totalActiveBookings || 0} active booking{deletionStatus.totalActiveBookings !== 1 ? 's' : ''}
                  </span>
                  . Cancel or complete all bookings before deleting.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={isChecking || isDeleting}
            className="h-9 px-5 rounded-md border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950 transition-colors disabled:opacity-40"
          >
            {deletionStatus?.canDelete ? 'Cancel' : 'Close'}
          </button>

          {deletionStatus?.canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 h-9 px-5 rounded-md bg-red-600 text-white text-[13px] font-medium hover:bg-red-700 transition-colors disabled:opacity-40"
            >
              {isDeleting ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Room
                </>
              )}
            </button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default RoomDeletionDialog;
