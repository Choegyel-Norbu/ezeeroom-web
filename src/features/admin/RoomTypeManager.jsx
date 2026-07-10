import React, { useState, useEffect } from "react";
import { Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import api from "../../shared/services/Api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/dialog";

const RoomTypeManager = ({ hotelId }) => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hotelId) return;
    const fetchRoomTypes = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/hotels/${hotelId}/room-types`);
        setRoomTypes(response.data);
      } catch {
        toast.error("Failed to load room types", { duration: 6000 });
      } finally {
        setLoading(false);
      }
    };
    fetchRoomTypes();
  }, [hotelId]);

  const openAddForm = () => {
    setName("");
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Room type name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post(`/hotels/${hotelId}/room-types`, { name: trimmed });
      setRoomTypes((prev) => [...prev, response.data]);
      toast.success("Room type added successfully!", { duration: 6000 });
      closeForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add room type");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-200 border-t-neutral-950" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-[14px] w-[14px] text-neutral-500" />
          <h3 className="text-[13px] font-semibold text-neutral-950">Room Types</h3>
          <span className="ml-1 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
            {roomTypes.length}
          </span>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-neutral-950 text-white text-[12px] font-medium hover:opacity-85 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Room Type
        </button>
      </div>

      {/* Add Room Type Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm w-full border border-neutral-200 shadow-none rounded-lg p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
            <DialogTitle className="text-[15px] font-semibold text-neutral-950 tracking-tight">
              Add Room Type
            </DialogTitle>
            <DialogDescription className="text-[12px] text-neutral-400 mt-0.5">
              Give your new room type a name, e.g. "Deluxe" or "Suite".
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-1.5">
              <label htmlFor="roomTypeName" className="text-[12px] font-medium text-neutral-600">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="roomTypeName"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Deluxe"
                maxLength={100}
                className={`w-full h-9 rounded-md border px-2.5 text-[13px] text-neutral-900 bg-neutral-50 outline-none focus:border-neutral-400 transition-colors ${
                  error ? "border-red-400" : "border-neutral-200"
                }`}
              />
              {error && <p className="text-[11px] text-red-500">{error}</p>}
            </div>
            <DialogFooter className="px-6 pb-6 pt-0 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                disabled={isSubmitting}
                className="h-9 px-5 rounded-md border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 h-9 px-5 rounded-md bg-neutral-950 text-white text-[13px] font-medium hover:opacity-85 transition-opacity disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Adding…
                  </>
                ) : (
                  "Add Room Type"
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Room Types Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-neutral-100 hover:bg-transparent">
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-5">
                Name
              </TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">
                Sort Order
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roomTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-32 text-center text-[13px] text-neutral-400">
                  No room types yet — click "Add Room Type" to get started.
                </TableCell>
              </TableRow>
            ) : (
              roomTypes.map((type) => (
                <TableRow key={type.id} className="border-b border-neutral-100 hover:bg-neutral-50/60 transition-colors">
                  <TableCell className="px-5 py-3">
                    <span className="text-[13px] font-medium text-neutral-950">{type.name}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-[13px] text-neutral-700 tabular-nums">{type.sortOrder}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RoomTypeManager;
