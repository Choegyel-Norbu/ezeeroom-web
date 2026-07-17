import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Upload,
  Bed,
  Wifi,
  Tv,
  Snowflake,
  Waves,
  BedSingle,
  BedDouble,
  Bath,
  Coffee,
  Utensils,
  Fan,
  Mountain,
  Leaf,
  Flame,
  MapPin,
  ShieldCheck,
  Landmark,
  Zap,
  Droplets,
  Shirt,
  Wind,
  Lock,
  Phone,
  Lightbulb,
  Refrigerator,
  Users,
  Clock,
  Check,
} from "lucide-react";
import { uploadFile } from "../../shared/services/uploadService";
import { toast } from "sonner";
import { useAuth } from "../authentication";
import api from "../../shared/services/Api";
import RoomDeletionDialog from "../../shared/components/RoomDeletionDialog";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/tooltip";
import { Checkbox } from "@/shared/components/checkbox";
import { Label } from "@/shared/components/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/dialog";

const standardAmenities = [
  { id: 1,  name: "Single Bed",                              icon: BedSingle },
  { id: 2,  name: "Double Bed",                              icon: BedDouble },
  { id: 3,  name: "Wi-Fi",                                   icon: Wifi },
  { id: 4,  name: "Smart TV",                                icon: Tv },
  { id: 5,  name: "Air Conditioning / Room Heater",          icon: Snowflake },
  { id: 6,  name: "Private Bathroom",                        icon: Bath },
  { id: 7,  name: "Complimentary Tea/Coffee",                icon: Coffee },
  { id: 8,  name: "Traditional Bhutanese Cuisine (on request)", icon: Utensils },
  { id: 9,  name: "Room Fan / Ventilation",                  icon: Fan },
  { id: 10, name: "Scenic Mountain View",                    icon: Mountain },
  { id: 11, name: "Eco-Friendly Amenities",                  icon: Leaf },
  { id: 12, name: "In-room Fire Extinguisher",               icon: Flame },
  { id: 13, name: "Local Travel Assistance",                 icon: MapPin },
  { id: 14, name: "24/7 Security",                           icon: ShieldCheck },
  { id: 15, name: "Balcony",                                 icon: Landmark },
  { id: 16, name: "Water Boiler / Kettle",                   icon: Zap },
  { id: 17, name: "Fresh Towels",                            icon: Shirt },
  { id: 18, name: "Hot Water Supply",                        icon: Droplets },
  { id: 19, name: "Room Heater",                             icon: Wind },
  { id: 20, name: "Room Safe / Locker",                      icon: Lock },
  { id: 21, name: "Telephone",                               icon: Phone },
  { id: 22, name: "Reading Lights",                          icon: Lightbulb },
  { id: 23, name: "Mini Refrigerator",                       icon: Refrigerator },
  { id: 24, name: "Family Room (Multiple Guests)",           icon: Users },
  { id: 25, name: "24/7 Room Service",                       icon: Clock },
  { id: 26, name: "Daily Housekeeping",                      icon: Leaf },
  { id: 27, name: "Complimentary Toiletries",                icon: Bath },
  { id: 28, name: "Work Desk",                               icon: Lightbulb },
];

const bedTypeOptions = ["SINGLE", "TWIN", "DOUBLE", "QUEEN", "KING", "BUNK", "SOFA_BED"];
const bedTypeCapacity = { SINGLE: 1, TWIN: 1, DOUBLE: 2, QUEEN: 2, KING: 2, BUNK: 2, SOFA_BED: 1 };
const bedTypeLabels = {
  SINGLE: "Single", TWIN: "Twin", DOUBLE: "Double", QUEEN: "Queen",
  KING: "King", BUNK: "Bunk", SOFA_BED: "Sofa Bed",
};

// EP (Room Only) is the room's base price, not a configurable plan row.
// Owners set an absolute per-night rate for the meal-inclusive plans below.
const mealPlanOptions = ["CP", "MAP", "AP"];
const mealPlanLabels = {
  CP: "CP — Continental Plan (+ breakfast)",
  MAP: "MAP — Modified American Plan (+ breakfast & 1 meal)",
  AP: "AP — American Plan (+ all meals)",
};

const RoomManager = ({ hotelId }) => {
  const [showForm, setShowForm]               = useState(false);
  const [editingRoom, setEditingRoom]         = useState(null);
  const [roomAdded, setRoomAdded]             = useState(false);
  const [rooms, setRooms]                     = useState([]);
  const [roomTypes, setRoomTypes]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete]       = useState(null);
  const formRef = useRef(null);
  const lastMealPlanRowRef = useRef(null);
  const justAddedMealPlanRef = useRef(false);

  const [roomForm, setRoomForm] = useState({
    roomTypeId: "", price: "", roomNumber: "", maxGuests: "",
    active: true, description: "", images: [], amenities: [],
    bedConfigurations: [], mealPlans: [],
  });
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case "roomTypeId": return value ? "" : "Room type is required";
      case "price":      return !value ? "Price is required" : isNaN(value) || value <= 0 ? "Price must be a positive number" : "";
      case "roomNumber": return value ? "" : "Room number is required";
      case "maxGuests":  return !value ? "Max guests is required" : isNaN(value) || value <= 0 || value > 10 ? "Max guests must be 1–10" : "";
      case "description":return value.length >= 20 ? "" : "Description must be at least 20 characters";
      case "images":     return value.length > 0 ? "" : "At least one image is required";
      default:           return "";
    }
  };

  const validateForm = () => {
    const newErrors = {
      roomTypeId:  validateField("roomTypeId",  roomForm.roomTypeId),
      price:       validateField("price",       roomForm.price),
      roomNumber:  validateField("roomNumber",  roomForm.roomNumber),
      maxGuests:   validateField("maxGuests",   roomForm.maxGuests),
      description: validateField("description", roomForm.description),
      images:      validateField("images",      roomForm.images),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  useEffect(() => {
    if (!hotelId) return;
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/rooms/hotel/${hotelId}`);
        setRooms(response.data);
      } catch {
        toast.error("Failed to load rooms", { duration: 6000 });
      } finally {
        setLoading(false);
      }
    };
    const fetchRoomTypes = async () => {
      try {
        const response = await api.get(`/hotels/${hotelId}/room-types`);
        setRoomTypes(response.data);
      } catch {
        toast.error("Failed to load room types", { duration: 6000 });
      }
    };
    fetchRooms();
    fetchRoomTypes();
  }, [hotelId]);

  useEffect(() => {
    const handleStorageChange = (e) => { if (e.key === "hotelId") {} };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (editingRoom) {
      const roomToEdit = rooms.find((room) => room.id === editingRoom);
      if (roomToEdit) {
        setRoomForm({
          roomTypeId:  roomToEdit.roomTypeId != null ? String(roomToEdit.roomTypeId) : "",
          price:       roomToEdit.price || "",
          roomNumber:  roomToEdit.roomNumber || "",
          maxGuests:   roomToEdit.maxGuests || "",
          active:      roomToEdit.active !== false,
          description: roomToEdit.description || "",
          images:      roomToEdit.imageUrl?.map((url, index) => ({ url, name: `existing-${index}`, isExisting: true })) || [],
          amenities:   roomToEdit.amenities?.map((name) => standardAmenities.find((a) => a.name === name) || { name, id: Date.now() }) || [],
          bedConfigurations: roomToEdit.bedConfigurations?.map((bc) => ({ bedType: bc.bedType, quantity: bc.quantity })) || [],
          mealPlans:   roomToEdit.mealPlans?.map((mp) => ({ planType: mp.planType, price: mp.price })) || [],
        });
      }
    } else if (showForm) {
      resetForm();
    }
  }, [editingRoom, showForm, rooms]);

  const resetForm = () => {
    setRoomForm({
      roomTypeId: "", price: "", roomNumber: "", maxGuests: "", active: true, description: "", images: [], amenities: [],
      bedConfigurations: [], mealPlans: [],
    });
    setErrors({});
  };

  // Scroll the newly added meal plan row into view - only for rows added via
  // the "Add meal plan" button, not when an existing room's plans first load.
  useEffect(() => {
    if (justAddedMealPlanRef.current) {
      justAddedMealPlanRef.current = false;
      lastMealPlanRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [roomForm.mealPlans]);

  const totalBedCapacity = roomForm.bedConfigurations.reduce(
    (sum, bc) => sum + (bedTypeCapacity[bc.bedType] || 0) * (Number(bc.quantity) || 0), 0
  );
  const showBedCapacityWarning = roomForm.bedConfigurations.length > 0
    && roomForm.maxGuests
    && totalBedCapacity < Number(roomForm.maxGuests);

  const addBedConfigRow = () => {
    setRoomForm((prev) => ({ ...prev, bedConfigurations: [...prev.bedConfigurations, { bedType: "SINGLE", quantity: 1 }] }));
  };
  const updateBedConfigRow = (index, field, value) => {
    setRoomForm((prev) => ({
      ...prev,
      bedConfigurations: prev.bedConfigurations.map((row, i) => i === index ? { ...row, [field]: value } : row),
    }));
  };
  const removeBedConfigRow = (index) => {
    setRoomForm((prev) => ({ ...prev, bedConfigurations: prev.bedConfigurations.filter((_, i) => i !== index) }));
  };

  const addMealPlanRow = () => {
    const nextPlan = mealPlanOptions.find((p) => !roomForm.mealPlans.some((mp) => mp.planType === p));
    if (!nextPlan) return;
    justAddedMealPlanRef.current = true;
    setRoomForm((prev) => ({ ...prev, mealPlans: [...prev.mealPlans, { planType: nextPlan, price: prev.price ? String(prev.price) : "" }] }));
  };
  const updateMealPlanRow = (index, field, value) => {
    setRoomForm((prev) => ({
      ...prev,
      mealPlans: prev.mealPlans.map((row, i) => i === index ? { ...row, [field]: value } : row),
    }));
  };
  const removeMealPlanRow = (index) => {
    setRoomForm((prev) => ({ ...prev, mealPlans: prev.mealPlans.filter((_, i) => i !== index) }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    setRoomForm((prev) => ({ ...prev, [name]: fieldValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: validateField(name, fieldValue) }));
  };

  const handleSelectChange = (name, value) => {
    setRoomForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleImageUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const existingImages = roomForm.images || [];
    const remainingSlots = 5 - existingImages.length;
    if (remainingSlots <= 0) { toast.error("You can only upload up to 5 images.", { duration: 6000 }); return; }
    const maxFileSize = 4 * 1024 * 1024;
    const oversizedFiles = selectedFiles.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      toast.error(`File size too large: ${oversizedFiles.map(f => f.name).join(', ')}`, {
        description: "Each image must be smaller than 4MB.",
        duration: 8000,
      });
      return;
    }
    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    try {
      const newImages = filesToAdd.map((file) => ({ file, name: file.name, type: file.type, url: URL.createObjectURL(file), isNew: true }));
      setRoomForm((prev) => ({ ...prev, images: [...existingImages, ...newImages] }));
      if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));
    } catch {
      toast.error("Failed to process images", { duration: 6000 });
    }
  };

  const removeImage = (index) => setRoomForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const toggleAmenity = (amenity) => {
    setRoomForm((prev) => {
      const exists = prev.amenities.some((a) => a.id === amenity.id);
      return { ...prev, amenities: exists ? prev.amenities.filter((a) => a.id !== amenity.id) : [...prev.amenities, amenity] };
    });
  };

  const startEdit = (room) => { setEditingRoom(room.id); setShowForm(true); };
  const cancelEdit = () => { setEditingRoom(null); setShowForm(false); setErrors({}); };

  const scrollToFirstError = () => {
    const firstError = Object.keys(errors).find((key) => errors[key]);
    if (!firstError) return;
    // Query by data-field wrapper rather than [name=] so this also works for
    // fields like roomType (a Select) and images (a file drop zone) that have
    // no directly-named input element.
    const container = formRef.current?.querySelector(`[data-field="${firstError}"]`);
    if (container) {
      container.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = container.querySelector("input, textarea, button, [tabindex]");
      focusable?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!validateForm()) { scrollToFirstError(); setIsSubmitting(false); return; }
    try {
      const uploadResults = await Promise.all(roomForm.images.filter((img) => img.isNew && img.file).map((img) => uploadFile(img.file, "photos")));
      const existingImageUrls = roomForm.images.filter((img) => img.isExisting).map((img) => img.url);
      const newImageUrls = uploadResults.filter((res) => res.field === "photos" && res.url).map((res) => res.url);
      const payload = {
        ...roomForm,
        roomTypeId: Number(roomForm.roomTypeId),
        imageUrl: [...existingImageUrls, ...newImageUrls],
        amenities: roomForm.amenities.map((a) => a.name),
        mealPlans: roomForm.mealPlans.map((mp) => ({ ...mp, price: Number(mp.price) || 0 })),
      };
      if (editingRoom) {
        const response = await api.put(`/rooms/${editingRoom}`, payload);
        toast.success("Room updated successfully!", { duration: 6000 });
        setRooms((prev) => prev.map((room) => room.id === editingRoom ? response.data : room));
      } else {
        const response = await api.post(`/rooms/hotel/${hotelId}`, payload);
        toast.success("Room added successfully!", { duration: 6000 });
        setRooms((prev) => [...prev, response.data]);
        setRoomAdded(true);
        setTimeout(() => setRoomAdded(false), 3000);
      }
      cancelEdit();
    } catch (error) {
      if (error.response?.data?.errors) {
        const serverErrors = {};
        Object.keys(error.response.data.errors).forEach((key) => { serverErrors[key] = error.response.data.errors[key].join(", "); });
        setErrors(serverErrors);
        scrollToFirstError();
      } else {
        toast.error(error.response?.data?.message || "Failed to save room. Please try again.", { duration: 6000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (room) => { setRoomToDelete(room); setDeletionDialogOpen(true); };
  const handleDeleteSuccess = (roomId) => { setRooms((prev) => prev.filter((room) => room.id !== roomId)); setRoomToDelete(null); };
  const handleDeletionDialogClose = () => { setDeletionDialogOpen(false); setRoomToDelete(null); };

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
          <Bed className="h-[14px] w-[14px] text-neutral-500" />
          <h3 className="text-[13px] font-semibold text-neutral-950">All Rooms</h3>
          <span className="ml-1 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
            {rooms.length}
          </span>
        </div>
        <button
          onClick={() => (setShowForm(true), setEditingRoom(null))}
          className="flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-neutral-950 text-white text-[12px] font-medium hover:opacity-85 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Room
        </button>
      </div>

      {/* Room Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] flex flex-col border border-neutral-200 shadow-none rounded-lg p-0 gap-0">

          {/* Sticky header */}
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-neutral-100">
            <DialogTitle className="text-[15px] font-semibold text-neutral-950 tracking-tight">
              {editingRoom ? "Edit Room" : "Add New Room"}
            </DialogTitle>
            <DialogDescription className="text-[12px] text-neutral-400 mt-0.5">
              {editingRoom ? "Update room details below." : "Fill in the details to add a new room."}
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable body */}
          <form onSubmit={handleSubmit} ref={formRef} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Row 1: Type */}
              <div className="space-y-1.5" data-field="roomTypeId">
                <label className="text-[12px] font-medium text-neutral-600">
                  Room Type <span className="text-red-500">*</span>
                </label>
                <Select value={roomForm.roomTypeId} onValueChange={(v) => handleSelectChange("roomTypeId", v)}>
                  <SelectTrigger className={`w-full h-9 text-[13px] border-neutral-200 bg-neutral-50 shadow-none ${errors.roomTypeId ? "border-red-400" : ""}`}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)} className="text-[13px]">
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.roomTypeId && <p className="text-[11px] text-red-500">{errors.roomTypeId}</p>}
              </div>

              {/* Row 2: Price */}
              <div className="space-y-1.5" data-field="price">
                <label className="text-[12px] font-medium text-neutral-600">
                  Price / night (Nu.) <span className="text-red-500">*</span>
                </label>
                <input
                  name="price" type="number" min="0" step="1"
                  value={roomForm.price} onChange={handleInputChange}
                  placeholder="0"
                  className={`w-full h-9 rounded-md border px-3 text-[13px] text-neutral-900 bg-neutral-50 outline-none focus:border-neutral-400 transition-colors tabular-nums ${errors.price ? "border-red-400" : "border-neutral-200"}`}
                />
                {errors.price && <p className="text-[11px] text-red-500">{errors.price}</p>}
              </div>

              {/* Row 2: Room Number + Max Guests */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5" data-field="roomNumber">
                  <label className="text-[12px] font-medium text-neutral-600">
                    Room Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="roomNumber" value={roomForm.roomNumber} onChange={handleInputChange}
                    placeholder="e.g. 101"
                    className={`w-full h-9 rounded-md border px-3 text-[13px] text-neutral-900 bg-neutral-50 outline-none focus:border-neutral-400 transition-colors ${errors.roomNumber ? "border-red-400" : "border-neutral-200"}`}
                  />
                  {errors.roomNumber && <p className="text-[11px] text-red-500">{errors.roomNumber}</p>}
                </div>

                <div className="space-y-1.5" data-field="maxGuests">
                  <label className="text-[12px] font-medium text-neutral-600">
                    Max Guests <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="maxGuests" type="number" min="1" max="10" step="1"
                    value={roomForm.maxGuests} onChange={handleInputChange}
                    placeholder="1 – 10"
                    className={`w-full h-9 rounded-md border px-3 text-[13px] text-neutral-900 bg-neutral-50 outline-none focus:border-neutral-400 transition-colors tabular-nums ${errors.maxGuests ? "border-red-400" : "border-neutral-200"}`}
                  />
                  {errors.maxGuests && <p className="text-[11px] text-red-500">{errors.maxGuests}</p>}
                </div>
              </div>

              {/* Active status */}
              <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="active"
                    checked={roomForm.active}
                    onCheckedChange={(checked) => setRoomForm(prev => ({ ...prev, active: checked }))}
                    className="w-4 h-4"
                  />
                  <div>
                    <label htmlFor="active" className="text-[13px] font-medium text-neutral-950 cursor-pointer select-none">
                      Room Active
                    </label>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {roomForm.active ? "Available for booking" : "Hidden from booking"}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium flex-shrink-0 ${
                  roomForm.active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-neutral-100 text-neutral-500 border-neutral-200"
                }`}>
                  {roomForm.active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1.5" data-field="description">
                <label className="text-[12px] font-medium text-neutral-600">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description" rows={3} value={roomForm.description} onChange={handleInputChange}
                  placeholder="Describe the room — at least 20 characters…"
                  className={`w-full resize-none rounded-md border px-3.5 py-2.5 text-[13px] text-neutral-900 bg-neutral-50 outline-none focus:border-neutral-400 transition-colors placeholder-neutral-400 ${errors.description ? "border-red-400" : "border-neutral-200"}`}
                />
                {errors.description && <p className="text-[11px] text-red-500">{errors.description}</p>}
              </div>

              {/* Images */}
              <div className="space-y-2" data-field="images">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-neutral-600">
                    Room Images <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-neutral-400 tabular-nums">{roomForm.images.length} / 5</span>
                </div>

                {roomForm.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {roomForm.images.map((image, index) => (
                      <div key={index} className="relative flex-shrink-0">
                        <img src={image.url} alt={`Room ${index + 1}`} className="w-[72px] h-[72px] object-cover rounded-md border border-neutral-200" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-neutral-950 text-white flex items-center justify-center hover:opacity-80 transition-opacity"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label htmlFor="imageUpload" className={`flex flex-col items-center justify-center w-full h-24 rounded-md border border-dashed bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-colors ${errors.images ? "border-red-400" : "border-neutral-200"}`}>
                  <Upload className="h-4 w-4 text-neutral-400 mb-1.5" />
                  <span className="text-[12px] text-neutral-400">Click to upload images</span>
                  <span className="text-[11px] text-neutral-300 mt-0.5">Max 5 images · 4 MB each</span>
                  <input id="imageUpload" type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
                {errors.images && <p className="text-[11px] text-red-500">{errors.images}</p>}
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-neutral-600">Amenities</label>
                  {roomForm.amenities.length > 0 && (
                    <span className="text-[11px] text-neutral-500 tabular-nums">{roomForm.amenities.length} selected</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {standardAmenities.map((amenity) => {
                    const Icon = amenity.icon;
                    const isSelected = roomForm.amenities.some((a) => a.id === amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`flex items-center gap-1.5 h-8 px-3 rounded-md border text-[12px] font-medium transition-all ${
                          isSelected
                            ? "border-neutral-950 bg-neutral-950 text-white"
                            : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        {amenity.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bed Configuration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-neutral-600">Bed Configuration</label>
                  <button
                    type="button"
                    onClick={addBedConfigRow}
                    className="flex items-center gap-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add bed type
                  </button>
                </div>

                {roomForm.bedConfigurations.length === 0 && (
                  <p className="text-[11px] text-neutral-400">No bed types added yet.</p>
                )}

                {roomForm.bedConfigurations.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select value={row.bedType} onValueChange={(v) => updateBedConfigRow(index, "bedType", v)}>
                      <SelectTrigger className="h-9 flex-1 text-[13px] border-neutral-200 bg-neutral-50 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bedTypeOptions.map((type) => (
                          <SelectItem key={type} value={type} className="text-[13px]">{bedTypeLabels[type]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="number" min="1" step="1"
                      value={row.quantity}
                      onChange={(e) => updateBedConfigRow(index, "quantity", Number(e.target.value))}
                      className="w-20 h-9 rounded-md border border-neutral-200 px-2.5 text-[13px] text-neutral-900 bg-neutral-50 outline-none focus:border-neutral-400 transition-colors tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => removeBedConfigRow(index)}
                      className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-400 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {showBedCapacityWarning && (
                  <p className="text-[11px] text-amber-600">
                    Beds sleep {totalBedCapacity}, which is less than max guests ({roomForm.maxGuests}).
                  </p>
                )}
              </div>

              {/* Meal Plans */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-neutral-600">Meal Plan</label>
                  {roomForm.mealPlans.length < mealPlanOptions.length && (
                    <button
                      type="button"
                      onClick={addMealPlanRow}
                      className="flex items-center gap-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add meal plan
                    </button>
                  )}
                </div>

                {roomForm.mealPlans.length === 0 && (
                  <p className="text-[11px] text-neutral-400">No meal plans added yet.</p>
                )}

                {roomForm.mealPlans.map((row, index) => {
                  const planRate = Number(row.price) || 0;
                  const isLastRow = index === roomForm.mealPlans.length - 1;
                  return (
                    <div key={index} ref={isLastRow ? lastMealPlanRowRef : null} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Select value={row.planType} onValueChange={(v) => updateMealPlanRow(index, "planType", v)}>
                          <SelectTrigger className="h-9 flex-1 min-w-0 text-[13px] border-neutral-200 bg-neutral-50 shadow-none [&>span]:truncate">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {mealPlanOptions
                              .filter((p) => p === row.planType || !roomForm.mealPlans.some((mp) => mp.planType === p))
                              .map((type) => (
                                <SelectItem key={type} value={type} className="text-[13px]">{mealPlanLabels[type]}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[12px] text-neutral-400">Nu.</span>
                          <input
                            type="number" min="1" step="1"
                            value={row.price}
                            onChange={(e) => updateMealPlanRow(index, "price", e.target.value)}
                            className="w-20 h-9 rounded-md border border-neutral-200 px-2.5 text-[13px] text-neutral-900 bg-neutral-50 outline-none focus:border-neutral-400 transition-colors tabular-nums"
                          />
                          <span className="text-[12px] text-neutral-400">/night</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMealPlanRow(index)}
                          className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-400 hover:text-red-600 hover:border-red-200 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-neutral-400 pl-0.5">
                        Room price with {row.planType}: <span className="font-medium text-neutral-600 tabular-nums">Nu. {planRate.toFixed(2)}</span> / night
                      </p>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Sticky footer */}
            <div className="flex-shrink-0 border-t border-neutral-100 px-6 py-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
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
                    {editingRoom ? "Updating…" : "Adding…"}
                  </>
                ) : editingRoom ? "Update Room" : "Add Room"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rooms Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-neutral-100 hover:bg-transparent">
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-5">Room No.</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Type</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Max Guests</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Price</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Amenities</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Status</TableHead>
              <TableHead className="h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-[13px] text-neutral-400">
                  No rooms yet — click "Add Room" to get started.
                </TableCell>
              </TableRow>
            ) : rooms.map((room) => (
              <TableRow key={room.id} className="border-b border-neutral-100 hover:bg-neutral-50/60 transition-colors">

                <TableCell className="px-5 py-3">
                  <span className="text-[13px] font-semibold text-neutral-950 tabular-nums">{room.roomNumber}</span>
                </TableCell>

                <TableCell className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                    {room.roomTypeName}
                  </span>
                </TableCell>

                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[13px] text-neutral-700">
                    <Users className="h-[12px] w-[12px] text-neutral-400" />
                    {room.maxGuests || '–'}
                  </div>
                </TableCell>

                <TableCell className="px-4 py-3">
                  <span className="text-[13px] font-semibold text-neutral-950 tabular-nums">
                    Nu. {typeof room.price === 'number' && !isNaN(room.price) ? room.price.toFixed(2) : '–'}
                  </span>
                </TableCell>

                <TableCell className="px-4 py-3 max-w-[220px]">
                  <span className="text-[12px] text-neutral-400 truncate block">
                    {Array.isArray(room.amenities) ? room.amenities.join(", ") : room.amenities}
                  </span>
                </TableCell>

                <TableCell className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                    room.active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {room.active ? "Active" : "Inactive"}
                  </span>
                </TableCell>

                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => startEdit(room)}
                            className="h-7 w-7 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                          >
                            <Edit className="h-[13px] w-[13px]" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">Edit room</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleDeleteClick(room)}
                            className="h-7 w-7 flex items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="h-[13px] w-[13px]" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">Delete room</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Room Deletion Dialog */}
      <RoomDeletionDialog
        isOpen={deletionDialogOpen}
        onClose={handleDeletionDialogClose}
        room={roomToDelete}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default RoomManager;
