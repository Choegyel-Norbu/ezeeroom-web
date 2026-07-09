import React, { useEffect, useState } from "react";
import { useAuth } from "../authentication";
import api from "../../shared/services/Api";
import { uploadFile, deleteFileByUrl } from "../../shared/services/uploadService";
import { CheckCircle, XCircle, Upload, Plus, X, MapPin, Facebook, Instagram, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { getCategorizedAmenities } from "../../shared/utils/amenitiesHelper";
import { districts, getLocalitiesForDistrict, BankType, getBankOptions, getMaxAccountNumberLength, validateBankAccountNumber } from "../../shared/constants";

const TikTokIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.849-1.349-2.019-1.349-3.338h-3.064v13.925a3.649 3.649 0 1 1-2.676-3.51V8.307a6.593 6.593 0 0 0-2.676.563 6.65 6.65 0 0 0-4.854 6.4c0 3.676 2.974 6.65 6.65 6.65s6.65-2.974 6.65-6.65V9.412a9.193 9.193 0 0 0 5.321 1.674V8.022a6.196 6.196 0 0 1-2.422-2.46z" />
  </svg>
);

const formSchema = z.object({
  name: z.string().min(1, "Hotel name is required"),
  hotelType: z.string().min(1, "Hotel type is required"),
  district: z.string().min(1, "District is required"),
  locality: z.string().min(1, "Locality is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  description: z.string().min(1, "Description is required"),
  photoUrls: z.array(z.string()).optional(),
  license: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  cancellationPolicy: z.string().min(1, "Cancellation policy is required"),
  checkInTime: z.string().min(1, "Check-in time is required"),
  checkOutTime: z.string().min(1, "Check-out time is required"),
  facebookUrl: z.string().url("Please enter a valid Facebook URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Please enter a valid Instagram URL").optional().or(z.literal("")),
  tiktokUrl: z.string().url("Please enter a valid TikTok URL").optional().or(z.literal("")),
  websiteUrl: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  accountNumber: z.string().optional(),
  accountHolderName: z.string().optional(),
  bankType: z.string().optional(),
});

const inputCls = "h-9 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 text-[13px] text-neutral-950 focus:outline-none focus:border-neutral-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
const sectionLabelCls = "text-[11px] font-semibold uppercase tracking-widest text-neutral-400";
const formLabelCls = "text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1 block";

const SectionDivider = ({ icon: Icon, label }) => (
  <div className="border-t border-neutral-100 pt-5 mt-5">
    <div className="flex items-center gap-1.5 mb-4">
      {Icon && <Icon className="h-3.5 w-3.5 text-neutral-400" />}
      <h4 className={sectionLabelCls}>{label}</h4>
    </div>
  </div>
);

const InfoTile = ({ label, value }) => (
  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
    <p className={`${sectionLabelCls} mb-0.5`}>{label}</p>
    <p className="text-[13px] font-medium text-neutral-950 truncate">{value || "—"}</p>
  </div>
);

const HotelInfoForm = ({ hotel, onUpdate }) => {
  const { email } = useAuth();
  const [formData, setFormData] = useState({ ...hotel, locality: hotel.locality || "" });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState(hotel.amenities || []);
  const [availableAmenities] = useState(getCategorizedAmenities("hotel"));
  const [deletingImageIndex, setDeletingImageIndex] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [policySelectionType, setPolicySelectionType] = useState("predefined");

  const cancellationPolicyOptions = [
    {
      id: "free_24h",
      label: "Free cancellation up to 24 hours",
      description: "Guests can cancel free of charge up to 24 hours before check-in. No refund for cancellations within 24 hours.",
      refundBreakdown: [
        { timeframe: "24+ hours before check-in", refund: "100%" },
        { timeframe: "Within 24 hours", refund: "0%" },
        { timeframe: "No-show", refund: "0%" }
      ]
    },
    {
      id: "free_48h",
      label: "Free cancellation up to 48 hours",
      description: "Guests can cancel free of charge up to 48 hours before check-in. No refund for cancellations within 48 hours.",
      refundBreakdown: [
        { timeframe: "48+ hours before check-in", refund: "100%" },
        { timeframe: "Within 48 hours", refund: "0%" },
        { timeframe: "No-show", refund: "0%" }
      ]
    },
    {
      id: "free_7days",
      label: "Free cancellation up to 7 days",
      description: "Guests can cancel free of charge up to 7 days before check-in. No refund for cancellations within 7 days.",
      refundBreakdown: [
        { timeframe: "7+ days before check-in", refund: "100%" },
        { timeframe: "Within 7 days", refund: "0%" },
        { timeframe: "No-show", refund: "0%" }
      ]
    },
    {
      id: "partial_24h",
      label: "Partial refund within 24 hours",
      description: "Free cancellation up to 24 hours before check-in. 50% refund for cancellations within 24 hours. No refund for no-shows.",
      refundBreakdown: [
        { timeframe: "24+ hours before check-in", refund: "100%" },
        { timeframe: "Within 24 hours", refund: "50%" },
        { timeframe: "No-show", refund: "0%" }
      ]
    },
    {
      id: "partial_48h",
      label: "Partial refund within 48 hours",
      description: "Free cancellation up to 48 hours before check-in. 50% refund for cancellations within 48 hours. No refund for no-shows.",
      refundBreakdown: [
        { timeframe: "48+ hours before check-in", refund: "100%" },
        { timeframe: "Within 48 hours", refund: "50%" },
        { timeframe: "No-show", refund: "0%" }
      ]
    },
    {
      id: "graduated_refund",
      label: "Graduated refund policy",
      description: "Progressive refund structure: 100% refund 7+ days, 75% refund 3-7 days, 50% refund 1-3 days, 25% refund within 24 hours, 0% for no-shows.",
      refundBreakdown: [
        { timeframe: "7+ days before check-in", refund: "100%" },
        { timeframe: "3-7 days before check-in", refund: "75%" },
        { timeframe: "1-3 days before check-in", refund: "50%" },
        { timeframe: "Within 24 hours", refund: "25%" },
        { timeframe: "No-show", refund: "0%" }
      ]
    },
    {
      id: "strict_no_refund",
      label: "Strict - No refund policy",
      description: "No refunds for any cancellations or no-shows. Full payment required regardless of cancellation timing.",
      refundBreakdown: [
        { timeframe: "Any time before check-in", refund: "0%" },
        { timeframe: "No-show", refund: "0%" }
      ]
    },
    {
      id: "seasonal_policy",
      label: "Seasonal policy",
      description: "Free cancellation up to 7 days before check-in during off-season. No refunds during peak season (Dec-Mar, Jun-Aug).",
      refundBreakdown: [
        { timeframe: "Off-season: 7+ days before check-in", refund: "100%" },
        { timeframe: "Off-season: Within 7 days", refund: "0%" },
        { timeframe: "Peak season: Any time", refund: "0%" },
        { timeframe: "No-show", refund: "0%" }
      ]
    }
  ];

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: hotel.name || "",
      hotelType: hotel.hotelType || "",
      district: hotel.district || "",
      locality: hotel.locality || "",
      address: hotel.address || "",
      phone: hotel.phone || "",
      description: hotel.description || "",
      photoUrls: hotel.photoUrls || [],
      license: hotel.license || "",
      amenities: hotel.amenities || [],
      latitude: hotel.latitude ? parseFloat(hotel.latitude) : undefined,
      longitude: hotel.longitude ? parseFloat(hotel.longitude) : undefined,
      cancellationPolicy: hotel.cancellationPolicy || "",
      checkInTime: hotel.checkinTime || "01:00:00",
      checkOutTime: hotel.checkoutTime || "13:00:00",
      facebookUrl: hotel.facebookUrl || "",
      instagramUrl: hotel.instagramUrl || "",
      tiktokUrl: hotel.tiktokUrl || "",
      websiteUrl: hotel.websiteUrl || "",
      accountNumber: hotel.accountNumber || "",
      accountHolderName: hotel.accountHolderName || "",
      bankType: hotel.bankType || "",
    },
  });

  useEffect(() => {
    setFormData({ ...hotel, locality: hotel.locality || "" });
    setSelectedAmenities(hotel.amenities || []);
    form.reset({
      name: hotel.name || "",
      hotelType: hotel.hotelType || "",
      district: hotel.district || "",
      locality: hotel.locality || "",
      address: hotel.address || "",
      phone: hotel.phone || "",
      description: hotel.description || "",
      photoUrls: hotel.photoUrls || [],
      license: hotel.license || "",
      amenities: hotel.amenities || [],
      latitude: hotel.latitude ? parseFloat(hotel.latitude) : undefined,
      longitude: hotel.longitude ? parseFloat(hotel.longitude) : undefined,
      cancellationPolicy: hotel.cancellationPolicy || "",
      checkInTime: hotel.checkinTime || "01:00:00",
      checkOutTime: hotel.checkoutTime || "01:00:00",
      facebookUrl: hotel.facebookUrl || "",
      instagramUrl: hotel.instagramUrl || "",
      tiktokUrl: hotel.tiktokUrl || "",
      websiteUrl: hotel.websiteUrl || "",
      accountNumber: hotel.accountNumber || "",
      accountHolderName: hotel.accountHolderName || "",
      bankType: hotel.bankType || "",
    });
  }, [hotel, form]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const maxFileSize = 4 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(file => file.name).join(', ');
      toast.error(`File size too large: ${fileNames}`, { description: "Each image must be smaller than 4MB.", duration: 8000 });
      return;
    }
    setIsLoading(true);
    try {
      const uploadPromises = files.map((file) => uploadFile(file, "photos"));
      const results = await Promise.all(uploadPromises);
      const newImageUrls = results.map((result) => result.url);
      const updatedPhotoUrls = [...formData.photoUrls, ...newImageUrls];
      setFormData((prev) => ({ ...prev, photoUrls: updatedPhotoUrls }));
      form.setValue("photoUrls", updatedPhotoUrls);
      toast.success("Images uploaded successfully.", { duration: 6000 });
    } catch (err) {
      toast.error("Failed to upload images. Please try again.", { duration: 6000 });
      console.error("Image upload error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = async (index) => {
    const imageUrl = formData.photoUrls[index];
    if (!imageUrl) { toast.error("No image URL found to delete"); return; }
    setDeletingImageIndex(index);
    try {
      const result = await deleteFileByUrl(imageUrl);
      if (result.success) {
        const updatedPhotoUrls = formData.photoUrls.filter((_, i) => i !== index);
        setFormData((prev) => ({ ...prev, photoUrls: updatedPhotoUrls }));
        form.setValue("photoUrls", updatedPhotoUrls);
        toast.success(result.message || "Image deleted successfully", { duration: 6000 });
      } else {
        toast.error(result.message || "Failed to delete image", { duration: 6000 });
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image. Please try again.", { duration: 6000 });
    } finally {
      setDeletingImageIndex(null);
    }
  };

  const handleAmenityToggle = (amenity) => {
    const updatedAmenities = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(updatedAmenities);
    form.setValue("amenities", updatedAmenities);
  };

  const handleDistrictChange = (value) => {
    form.setValue("locality", "");
    form.setValue("district", value);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.", { duration: 6000 });
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue("latitude", latitude);
        form.setValue("longitude", longitude);
        toast.success("Location obtained successfully!", {
          description: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`,
          duration: 6000
        });
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = "Failed to get location.";
        switch (error.code) {
          case error.PERMISSION_DENIED: errorMessage = "Location access denied. Please enable location permissions."; break;
          case error.POSITION_UNAVAILABLE: errorMessage = "Location information is unavailable."; break;
          case error.TIMEOUT: errorMessage = "Location request timed out."; break;
          default: errorMessage = "An unknown error occurred while getting location."; break;
        }
        toast.error(errorMessage, { duration: 8000 });
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset({
      name: hotel.name || "",
      hotelType: hotel.hotelType || "",
      district: hotel.district || "",
      locality: hotel.locality || "",
      address: hotel.address || "",
      phone: hotel.phone || "",
      description: hotel.description || "",
      photoUrls: hotel.photoUrls || [],
      license: hotel.license || "",
      amenities: hotel.amenities || [],
      latitude: hotel.latitude ? parseFloat(hotel.latitude) : undefined,
      longitude: hotel.longitude ? parseFloat(hotel.longitude) : undefined,
      cancellationPolicy: hotel.cancellationPolicy || "",
      checkInTime: hotel.checkinTime || "14:00",
      checkOutTime: hotel.checkoutTime || "11:00",
      facebookUrl: hotel.facebookUrl || "",
      instagramUrl: hotel.instagramUrl || "",
      tiktokUrl: hotel.tiktokUrl || "",
      websiteUrl: hotel.websiteUrl || "",
      accountNumber: hotel.accountNumber || "",
      accountHolderName: hotel.accountHolderName || "",
      bankType: hotel.bankType || "",
    });
    setFormData({ ...hotel, locality: hotel.locality || "" });
    setSelectedAmenities(hotel.amenities || []);
  };

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      if (values.bankType || values.accountNumber || values.accountHolderName) {
        if (!values.bankType) { form.setError("bankType", { message: "Bank type is required" }); throw new Error("validation"); }
        if (!values.accountHolderName) { form.setError("accountHolderName", { message: "Account holder name is required" }); throw new Error("validation"); }
        if (values.accountHolderName && values.accountHolderName.trim().length < 2) { form.setError("accountHolderName", { message: "Account holder name must be at least 2 characters" }); throw new Error("validation"); }
        if (values.accountHolderName && !/^[a-zA-Z\s\-'\.]+$/.test(values.accountHolderName.trim())) { form.setError("accountHolderName", { message: "Account holder name can only contain letters, spaces, hyphens, apostrophes, and periods" }); throw new Error("validation"); }
        if (!values.accountNumber) { form.setError("accountNumber", { message: "Account number is required" }); throw new Error("validation"); }
        const bankValidation = validateBankAccountNumber(String(values.accountNumber).trim(), values.bankType);
        if (!bankValidation.isValid) { form.setError("accountNumber", { message: bankValidation.error || "Invalid account number" }); throw new Error("validation"); }
      }
      const updateData = {
        ...values,
        contact: values.phone,
        amenities: selectedAmenities,
        id: formData.id,
        latitude: values.latitude,
        longitude: values.longitude,
        checkinTime: values.checkInTime,
        checkoutTime: values.checkOutTime,
        facebookUrl: values.facebookUrl || null,
        instagramUrl: values.instagramUrl || null,
        tiktokUrl: values.tiktokUrl || null,
        websiteUrl: values.websiteUrl || null,
        accountNumber: values.accountNumber || null,
        accountHolderName: values.accountHolderName || null,
        bankType: values.bankType || null,
      };
      const res = await api.put(`/hotels/${formData.id}`, updateData);
      if (res.status === 200) {
        onUpdate(res.data);
        setIsEditing(false);
        toast.success("Hotel details updated successfully.", { duration: 6000 });
      }
    } catch (err) {
      toast.error("Failed to update hotel information.", { duration: 6000 });
      console.error("Update error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const hotelTypeLabel = {
    ONE_STAR: "One Star", TWO_STAR: "Two Star", THREE_STAR: "Three Star",
    FOUR_STAR: "Four Star", FIVE_STAR: "Five Star", BUDGET: "Budget",
    BOUTIQUE: "Boutique", RESORT: "Resort", HOMESTAY: "Homestay",
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg">
      {/* Sticky header */}
      <div className="px-5 py-4 border-b border-neutral-100 sticky top-12 z-10 bg-white flex items-center justify-between">
        <div>
          <span className={sectionLabelCls}>Hotel</span>
          <h2 className="text-[15px] font-semibold text-neutral-950 leading-none mt-0.5">Hotel Information</h2>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="h-8 px-4 rounded-md border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="h-8 px-4 rounded-md border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading}
              className="h-8 px-4 rounded-md bg-neutral-950 text-white text-[12px] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              {isLoading && <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />}
              {isLoading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Form body */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-5">

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className={formLabelCls}>Hotel Name</FormLabel>
                <FormControl>
                  <input {...field} disabled={!isEditing} className={inputCls} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="hotelType" render={({ field }) => (
              <FormItem>
                <FormLabel className={formLabelCls}>Hotel Type</FormLabel>
                {!isEditing ? (
                  <div className={inputCls + " flex items-center"}>
                    {hotelTypeLabel[hotel.hotelType] || hotel.hotelType || "—"}
                  </div>
                ) : (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-[13px] border-neutral-200 bg-neutral-50 focus:ring-0 focus:ring-offset-0 focus:border-neutral-400">
                        <SelectValue placeholder="Select Hotel Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ONE_STAR">One Star</SelectItem>
                      <SelectItem value="TWO_STAR">Two Star</SelectItem>
                      <SelectItem value="THREE_STAR">Three Star</SelectItem>
                      <SelectItem value="FOUR_STAR">Four Star</SelectItem>
                      <SelectItem value="FIVE_STAR">Five Star</SelectItem>
                      <SelectItem value="BUDGET">Budget</SelectItem>
                      <SelectItem value="BOUTIQUE">Boutique</SelectItem>
                      <SelectItem value="RESORT">Resort</SelectItem>
                      <SelectItem value="HOMESTAY">Homestay</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Location */}
          <SectionDivider icon={MapPin} label="Location" />
          <div className="space-y-4">
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel className={formLabelCls}>Address</FormLabel>
                <FormControl>
                  <input {...field} disabled={!isEditing} placeholder="Enter full address" className={inputCls} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="district" render={({ field }) => (
                <FormItem>
                  <FormLabel className={formLabelCls}>District</FormLabel>
                  {!isEditing ? (
                    <div className={inputCls + " flex items-center"}>{hotel.district || "—"}</div>
                  ) : (
                    <Select onValueChange={handleDistrictChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-[13px] border-neutral-200 bg-neutral-50 focus:ring-0 focus:ring-offset-0 focus:border-neutral-400">
                          <SelectValue placeholder="Select District" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="locality" render={({ field }) => (
                <FormItem>
                  <FormLabel className={formLabelCls}>Locality</FormLabel>
                  {!isEditing ? (
                    <div className={inputCls + " flex items-center"}>{hotel.locality || "—"}</div>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-[13px] border-neutral-200 bg-neutral-50 focus:ring-0 focus:ring-offset-0 focus:border-neutral-400">
                          <SelectValue placeholder="Select Locality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getLocalitiesForDistrict(form.watch("district")).map((locality) => (
                          <SelectItem key={locality} value={locality}>{locality}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="latitude" render={({ field }) => (
                <FormItem>
                  <FormLabel className={formLabelCls}>Latitude</FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      type="number"
                      step="any"
                      placeholder="e.g., 27.7172"
                      disabled={!isEditing}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={inputCls}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="longitude" render={({ field }) => (
                <FormItem>
                  <FormLabel className={formLabelCls}>Longitude</FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      type="number"
                      step="any"
                      placeholder="e.g., 85.3240"
                      disabled={!isEditing}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={inputCls}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <p className="text-[11px] text-neutral-400">Enter coordinates manually for more accuracy.</p>

            {isEditing && (
              <div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="h-8 px-4 rounded-md border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  {isGettingLocation ? (
                    <>
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-neutral-300 border-t-neutral-700" />
                      Getting Location…
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3.5 w-3.5" />
                      Use Current Location
                    </>
                  )}
                </button>
                <p className="text-[11px] text-neutral-400 mt-1.5">Automatically detect your hotel's GPS coordinates.</p>
              </div>
            )}
          </div>

          {/* Contact */}
          <SectionDivider label="Contact" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel className={formLabelCls}>Phone</FormLabel>
                <FormControl>
                  <input type="tel" {...field} disabled={!isEditing} className={inputCls} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="websiteUrl" render={({ field }) => (
              <FormItem>
                <FormLabel className={formLabelCls}>Website URL</FormLabel>
                {!isEditing && hotel.websiteUrl ? (
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                    <a
                      href={hotel.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-neutral-600 hover:text-neutral-950 truncate block transition-colors"
                      title={hotel.websiteUrl}
                    >
                      {hotel.websiteUrl}
                    </a>
                  </div>
                ) : (
                  <FormControl>
                    <input type="url" {...field} placeholder="https://yourhotel.com" disabled={!isEditing} className={inputCls} />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Check-in / Check-out */}
          <SectionDivider icon={Clock} label="Check-in & Check-out" />
          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoTile label="Check-in Time" value={hotel.checkinTime || "01:00:00"} />
              <InfoTile label="Check-out Time" value={hotel.checkoutTime || "01:00:00"} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="checkInTime" render={({ field }) => (
                <FormItem>
                  <FormLabel className={formLabelCls}>Check-in Time</FormLabel>
                  <FormControl>
                    <input {...field} type="time" className={inputCls} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="checkOutTime" render={({ field }) => (
                <FormItem>
                  <FormLabel className={formLabelCls}>Check-out Time</FormLabel>
                  <FormControl>
                    <input {...field} type="time" className={inputCls} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}

          {/* Social Media */}
          <SectionDivider label="Social Media" />
          {!isEditing ? (
            (hotel.facebookUrl || hotel.instagramUrl || hotel.tiktokUrl) ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {hotel.facebookUrl && (
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                    <Facebook className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`${sectionLabelCls} mb-0.5`}>Facebook</p>
                      <a href={hotel.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-neutral-600 hover:text-neutral-950 truncate block">{hotel.facebookUrl}</a>
                    </div>
                  </div>
                )}
                {hotel.instagramUrl && (
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                    <Instagram className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`${sectionLabelCls} mb-0.5`}>Instagram</p>
                      <a href={hotel.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-neutral-600 hover:text-neutral-950 truncate block">{hotel.instagramUrl}</a>
                    </div>
                  </div>
                )}
                {hotel.tiktokUrl && (
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                    <TikTokIcon className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`${sectionLabelCls} mb-0.5`}>TikTok</p>
                      <a href={hotel.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-neutral-600 hover:text-neutral-950 truncate block">{hotel.tiktokUrl}</a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-6 px-4 border border-dashed border-neutral-200 rounded-md">
                <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <Facebook className="h-4 w-4 text-neutral-400" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-neutral-950">No social media links</p>
                  <p className="text-[12px] text-neutral-500 mt-0.5">Click Edit to add your social media profiles.</p>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="facebookUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={formLabelCls}>
                      <span className="flex items-center gap-1.5"><Facebook className="h-3 w-3" />Facebook</span>
                    </FormLabel>
                    <FormControl>
                      <input {...field} type="url" placeholder="https://facebook.com/yourhotel" className={inputCls} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="instagramUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={formLabelCls}>
                      <span className="flex items-center gap-1.5"><Instagram className="h-3 w-3" />Instagram</span>
                    </FormLabel>
                    <FormControl>
                      <input {...field} type="url" placeholder="https://instagram.com/yourhotel" className={inputCls} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tiktokUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={formLabelCls}>
                      <span className="flex items-center gap-1.5"><TikTokIcon className="h-3 w-3" />TikTok</span>
                    </FormLabel>
                    <FormControl>
                      <input {...field} type="url" placeholder="https://tiktok.com/@yourhotel" className={inputCls} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex items-start gap-3 border-l-2 border-l-neutral-950 border border-neutral-200 bg-white px-4 py-3 rounded-r-md">
                <div>
                  <p className="text-[11px] font-semibold text-neutral-950 mb-1">Tips</p>
                  <ul className="text-[12px] text-neutral-500 space-y-0.5">
                    <li>Use complete profile URLs (e.g., https://facebook.com/yourhotel)</li>
                    <li>Keep your profiles active with photos and local attractions</li>
                    <li>Respond to guest comments and messages promptly</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Bank Account */}
          <SectionDivider label="Bank Account" />
          {!isEditing ? (
            (hotel.accountNumber || hotel.accountHolderName || hotel.bankType) ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {hotel.bankType && <InfoTile label="Bank" value={hotel.bankType} />}
                {hotel.accountHolderName && <InfoTile label="Account Holder" value={hotel.accountHolderName} />}
                {hotel.accountNumber && <InfoTile label="Account Number" value={hotel.accountNumber} />}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-6 px-4 border border-dashed border-neutral-200 rounded-md">
                <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-neutral-950">No bank account information</p>
                  <p className="text-[12px] text-neutral-500 mt-0.5">Click Edit to add your bank account details.</p>
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="bankType" render={({ field }) => (
                <FormItem>
                  <FormLabel className={formLabelCls}>Bank Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const maxLen = getMaxAccountNumberLength(value) || 20;
                      const currentAcc = form.getValues("accountNumber") || "";
                      const trimmed = String(currentAcc).replace(/\D/g, "").slice(0, maxLen);
                      form.setValue("accountNumber", trimmed);
                      field.onChange(value);
                      form.clearErrors(["bankType", "accountNumber"]);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9 text-[13px] border-neutral-200 bg-neutral-50 focus:ring-0 focus:ring-offset-0 focus:border-neutral-400">
                        <SelectValue placeholder="Select Bank" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getBankOptions().map((bank) => (
                        <SelectItem key={bank.value} value={bank.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{bank.label}</span>
                            <span className="text-xs text-muted-foreground">{bank.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="accountHolderName" render={({ field }) => (
                <FormItem>
                  <FormLabel className={formLabelCls}>Account Holder Name</FormLabel>
                  <FormControl>
                    <input {...field} placeholder="Enter account holder name" className={inputCls} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="accountNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel className={formLabelCls}>Account Number</FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      inputMode="numeric"
                      maxLength={getMaxAccountNumberLength(form.watch("bankType")) || 20}
                      onChange={(e) => {
                        const bankCode = form.watch("bankType");
                        const maxLen = getMaxAccountNumberLength(bankCode) || 20;
                        const digitsOnly = (e.target.value || "").replace(/\D/g, "").slice(0, maxLen);
                        field.onChange(digitsOnly);
                        if (form.getFieldState("accountNumber").error) form.clearErrors("accountNumber");
                      }}
                      placeholder="Enter account number"
                      className={inputCls}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          )}

          {/* Description */}
          <SectionDivider label="Description" />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormControl>
                <textarea
                  {...field}
                  rows={4}
                  disabled={!isEditing}
                  className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] text-neutral-950 focus:outline-none focus:border-neutral-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Cancellation Policy */}
          <SectionDivider label="Cancellation Policy" />
          {!isEditing ? (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-md">
              <p className="text-[13px] text-neutral-600 leading-relaxed">
                {hotel.cancellationPolicy || "No cancellation policy set."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="policyType"
                    value="predefined"
                    checked={policySelectionType === "predefined"}
                    onChange={(e) => {
                      setPolicySelectionType(e.target.value);
                      if (e.target.value === "predefined") form.setValue("cancellationPolicy", "");
                    }}
                    className="h-3.5 w-3.5 accent-neutral-950"
                  />
                  <span className="text-[12px] font-medium text-neutral-600">Common policies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="policyType"
                    value="custom"
                    checked={policySelectionType === "custom"}
                    onChange={(e) => {
                      setPolicySelectionType(e.target.value);
                      if (e.target.value === "custom") form.setValue("cancellationPolicy", "");
                    }}
                    className="h-3.5 w-3.5 accent-neutral-950"
                  />
                  <span className="text-[12px] font-medium text-neutral-600">Custom policy</span>
                </label>
              </div>

              {policySelectionType === "predefined" && (
                <Select
                  value={(() => {
                    const currentPolicy = form.watch("cancellationPolicy");
                    const matchingOption = cancellationPolicyOptions.find(o => o.description === currentPolicy);
                    return matchingOption?.id || "";
                  })()}
                  onValueChange={(value) => {
                    const selectedPolicy = cancellationPolicyOptions.find(o => o.id === value);
                    if (selectedPolicy) form.setValue("cancellationPolicy", selectedPolicy.description);
                  }}
                >
                  <SelectTrigger className="h-9 text-[13px] border-neutral-200 bg-neutral-50 focus:ring-0 focus:ring-offset-0 focus:border-neutral-400">
                    <SelectValue placeholder="Select a cancellation policy">
                      {(() => {
                        const currentPolicy = form.watch("cancellationPolicy");
                        const matchingOption = cancellationPolicyOptions.find(o => o.description === currentPolicy);
                        return matchingOption ? matchingOption.label : "Select a cancellation policy";
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[60vh] overflow-y-auto w-full max-w-[90vw] sm:max-w-md">
                    {cancellationPolicyOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id} className="py-3 px-3">
                        <div className="space-y-2 w-full min-w-0">
                          <div className="font-medium text-sm leading-tight break-words">{option.label}</div>
                          <div className="text-xs text-muted-foreground leading-relaxed break-words line-clamp-3">{option.description}</div>
                          {option.refundBreakdown && (
                            <div className="flex flex-wrap gap-1">
                              {option.refundBreakdown.map((item, index) => (
                                <span key={index} className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                                  item.refund === "100%"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : item.refund === "0%"
                                    ? "bg-red-50 text-red-600"
                                    : "bg-amber-50 text-amber-700"
                                }`}>
                                  {item.refund}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {policySelectionType === "custom" && (
                <div className="space-y-3">
                  <FormField control={form.control} name="cancellationPolicy" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={4}
                          placeholder="e.g., Free cancellation up to 24 hours before check-in. Cancellations within 24 hours will be charged 50% of the total booking amount."
                          className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] text-neutral-950 focus:outline-none focus:border-neutral-400 transition-colors resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex items-start gap-3 border-l-2 border-l-neutral-950 border border-neutral-200 bg-white px-4 py-3 rounded-r-md">
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-950 mb-1">Tips for effective policies</p>
                      <ul className="text-[12px] text-neutral-500 space-y-0.5">
                        <li>Be specific about timeframes (hours, days)</li>
                        <li>Clearly state refund percentages (e.g., "50% refund")</li>
                        <li>Include no-show policies and seasonal variations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amenities */}
          <SectionDivider label="Amenities" />
          {selectedAmenities.length > 0 && (
            <div className="mb-4">
              <p className={`${sectionLabelCls} mb-2`}>Selected ({selectedAmenities.length})</p>
              <div className="flex flex-wrap gap-2">
                {selectedAmenities.map((amenity) => (
                  <span key={amenity} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-700">
                    {amenity}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleAmenityToggle(amenity)}
                        className="ml-0.5 hover:text-neutral-950 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!isEditing && selectedAmenities.length === 0 && (
            <p className="text-[13px] text-neutral-500">No amenities selected.</p>
          )}

          {isEditing && (
            <div className="space-y-3">
              {Object.entries(availableAmenities).map(([category, amenities]) => (
                <div key={category} className="border border-neutral-200 rounded-md overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-100">
                    <h6 className={sectionLabelCls}>{category.replace(/([A-Z])/g, ' $1').trim()}</h6>
                  </div>
                  <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {amenities.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleAmenityToggle(amenity)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md border transition-colors ${
                          selectedAmenities.includes(amenity)
                            ? "bg-neutral-950 text-white border-neutral-950"
                            : "bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-600"
                        }`}
                      >
                        {selectedAmenities.includes(amenity) ? (
                          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                        )}
                        <span className="truncate">{amenity}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hotel Images */}
          <SectionDivider label="Photos" />
          <div className="flex flex-wrap gap-3 mb-3">
            {formData.photoUrls?.map((image, index) => (
              <div key={index} className="relative">
                <img src={image} alt={`Hotel ${index}`} className="w-24 h-24 object-cover rounded-md border border-neutral-200" />
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={isLoading || deletingImageIndex === index}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deletingImageIndex === index ? (
                      <span className="animate-spin rounded-full h-3 w-3 border-[1.5px] border-white/30 border-t-white" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-neutral-200 rounded-md cursor-pointer hover:border-neutral-400 hover:bg-neutral-50/50 transition-colors">
              {isLoading ? (
                <div className="flex items-center gap-2 text-neutral-500">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-200 border-t-neutral-950" />
                  <span className="text-[12px]">Uploading…</span>
                </div>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-neutral-400 mb-2" />
                  <p className="text-[12px] font-medium text-neutral-600">Upload hotel images</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Max 4MB per file</p>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isLoading} />
                </>
              )}
            </label>
          )}

        </form>
      </Form>
    </div>
  );
};

export default HotelInfoForm;
