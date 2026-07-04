import React, { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../../shared/services/Api";
import subscriptionService from "../../shared/services/subscriptionService";
import { uploadFile } from "../../shared/services/uploadService";
import { toast } from "sonner";
import {
  CheckCircle,
  Upload,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Check,
  Hotel,
  Utensils,
  FileText,
  Camera,
  Shield,
  Navigation,
  AlertCircle,
  Lock,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";
import { Spinner } from "@/components/ui/ios-spinner";

import { Input } from "@/shared/components/input";
import { Label } from "@/shared/components/label";
import { Textarea } from "@/shared/components/textarea";
import { Checkbox } from "@/shared/components/checkbox";
import { TimePicker } from "@/shared/components/TimePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/select";
import { useAuth } from "../authentication";
import { getAmenitiesForType, getCategorizedAmenities } from "../../shared/utils/amenitiesHelper";
import { districts, getLocalitiesForDistrict, getBankOptions, validateBankAccountNumber, getMaxAccountNumberLength } from "../../shared/constants";
import { setStorageItem } from "../../shared/utils/safariLocalStorage";

const AddListingPage = () => {
  const [step, setStep] = useState(1);
  const {
    email,
    userId,
    setHotelId,
    setSelectedHotelId,
    setRoles,
  } = useAuth();
  const [listingType, setListingType] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    district: "",
    locality: "",
    address: "",
    email: "",
    phone: "",
    price: "",
    amenities: [],
    photos: [],
    license: null,
    idProof: null,
    notes: "",
    hotelType: "",
    latitude: "",
    longitude: "",
    numberOfRooms: "",
    roomTypesDescription: "",
    cid: "",
    destination: "",
    origin: "",
    checkinTime: "",
    checkoutTime: "",
    cancellationPolicy: "",
    hasTimeBased: false,
    accountNumber: "",
    accountHolderName: "",
    bankType: "",
    hasRestaurant: false,
    zhimpuRestaurant: {
      restaurantName: "",
      licenseNo: "",
      address: "",
      tpn: "",
      username: "",
      email: "",
      password: "",
      phoneNumber: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [policySelectionType, setPolicySelectionType] = useState("");
  const [showZhimpuPassword, setShowZhimpuPassword] = useState(false);

  const [locationState, setLocationState] = useState({
    isGettingLocation: false,
    locationError: null,
    locationSuccess: false
  });

  const navigate = useNavigate();

  // ─── Per-plan hotel limit gate ────────────────────────────────────────────
  // A user may only own multiple hotels on an active PRO plan. We mirror the
  // backend rule (HotelServiceImpl.enforceHotelLimit) here so a non-PRO owner
  // who already has a hotel sees an upgrade prompt instead of filling the form.
  // Fails open: if the check errors, we let them proceed and the backend gate
  // (HTTP 400) still protects correctness.
  const [planGateChecking, setPlanGateChecking] = useState(true);
  const [planBlocked, setPlanBlocked] = useState(false);

  useEffect(() => {
    let active = true;

    const checkHotelLimit = async () => {
      // Not logged in → first-time owner flow; nothing to block.
      if (!userId) {
        if (active) setPlanGateChecking(false);
        return;
      }

      try {
        const subscriptions = await subscriptionService.getSubscriptionsByUserId(userId);
        const list = Array.isArray(subscriptions) ? subscriptions : [];

        // No subscriptions yet → this is effectively their first hotel.
        if (list.length === 0) {
          if (active) setPlanBlocked(false);
          return;
        }

        // Allowed to add another hotel only with an active PRO subscription.
        const hasActivePro = list.some(
          (s) => s.subscriptionPlan === "PRO" && (s.isActive === true || s.active === true)
        );
        if (active) setPlanBlocked(!hasActivePro);
      } catch (error) {
        // Fail open — backend remains the authoritative gate.
        if (active) setPlanBlocked(false);
      } finally {
        if (active) setPlanGateChecking(false);
      }
    };

    checkHotelLimit();
    return () => {
      active = false;
    };
  }, [userId]);

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

  const listingTypes = [
    {
      id: "hotel",
      label: "Hotel",
      icon: Hotel,
      description: "Premium hospitality experiences with curated amenities and personalized guest services"
    },
    {
      id: "restaurant",
      label: "Restaurant",
      icon: Utensils,
      description: "Full dining establishment with complete menu",
      disabled: true
    },
  ];

  const currentAmenities = getAmenitiesForType(listingType);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationState({
        isGettingLocation: false,
        locationError: "Geolocation is not supported by this browser.",
        locationSuccess: false
      });
      return;
    }

    setLocationState({
      isGettingLocation: true,
      locationError: null,
      locationSuccess: false
    });

    const tryGetLocation = (useHighAccuracy = true, timeout = 15000) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          setFormData(prev => ({
            ...prev,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6)
          }));

          setLocationState({
            isGettingLocation: false,
            locationError: null,
            locationSuccess: true
          });

          setTimeout(() => {
            setLocationState(prev => ({
              ...prev,
              locationSuccess: false
            }));
          }, 3000);
        },
        (error) => {
          if (error.code === error.TIMEOUT && useHighAccuracy) {
            setLocationState(prev => ({
              ...prev,
              locationError: "High accuracy location timed out, trying approximate location..."
            }));

            setTimeout(() => tryGetLocation(false, 30000), 1000);
            return;
          }

          let errorMessage = "Failed to get location.";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please enable location permissions in your browser settings and try again.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Please check your internet connection and GPS settings.";
              break;
            case error.TIMEOUT:
              errorMessage = `Location request timed out after ${timeout/1000} seconds. Please ensure you have a stable internet connection and GPS is enabled.`;
              break;
            default:
              errorMessage = `An unknown error occurred while getting location (Code: ${error.code}).`;
              break;
          }

          setLocationState({
            isGettingLocation: false,
            locationError: errorMessage,
            locationSuccess: false
          });
        },
        {
          enableHighAccuracy: useHighAccuracy,
          timeout: timeout,
          maximumAge: useHighAccuracy ? 60000 : 600000
        }
      );
    };

    tryGetLocation();
  };

  const areCoordinatesValid = () => {
    const { latitude, longitude } = formData;
    return latitude && longitude && !isNaN(latitude) && !isNaN(longitude) &&
           latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxFileSize = 4 * 1024 * 1024;
    if (file.size > maxFileSize) {
      setErrors((prev) => ({
        ...prev,
        [field]: `File size too large: ${file.name}. File must be smaller than 4MB. Please compress your file and try again.`
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: {
        file: file,
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      },
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.photos.length > 5) {
      setErrors((prev) => ({ ...prev, photos: "Maximum 5 photos allowed" }));
      return;
    }

    const maxFileSize = 4 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxFileSize);

    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(file => file.name).join(', ');
      setErrors((prev) => ({
        ...prev,
        photos: `File size too large: ${fileNames}. Each image must be smaller than 4MB. Please compress your images and try again.`
      }));
      return;
    }

    const newPhotos = files.map((file) => ({
      file: file,
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos],
    }));

    if (errors.photos) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.photos;
        return newErrors;
      });
    }
  };

  const removePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const stepInfo = [
    { title: "Choose Type", description: "Select your business type", icon: Hotel },
    { title: "Business Details", description: "Tell us about your business", icon: FileText },
    { title: "Verification", description: "Upload required documents", icon: Shield },
    { title: "Review & Submit", description: "Final review before submission", icon: Check }
  ];

  const handleListingTypeChange = (typeId) => {
    setListingType(typeId);
    setFormData((prev) => ({
      ...prev,
      amenities: [],
    }));
    if (errors.listingType) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.listingType;
        return newErrors;
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        amenities: checked
          ? [...prev.amenities, name]
          : prev.amenities.filter((item) => item !== name),
      }));
    } else {
      if (name === "accountNumber") {
        const bankCode = formData.bankType;
        const maxLen = getMaxAccountNumberLength(bankCode) || 20;
        const digitsOnly = (value || "").replace(/\D/g, "").slice(0, maxLen);
        setFormData((prev) => ({
          ...prev,
          accountNumber: digitsOnly,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    }
  };

  const handleZhimpuRestaurantChange = (e) => {
    const { name, value } = e.target;
    const errorKey = `zhimpuRestaurant.${name}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
    setFormData((prev) => ({
      ...prev,
      zhimpuRestaurant: { ...prev.zhimpuRestaurant, [name]: value },
    }));
  };

  const handleHasRestaurantToggle = (checked) => {
    setFormData((prev) => ({
      ...prev,
      hasRestaurant: checked,
      zhimpuRestaurant: checked
        ? {
            ...prev.zhimpuRestaurant,
            restaurantName: prev.zhimpuRestaurant.restaurantName || prev.name,
            address: prev.zhimpuRestaurant.address || prev.address,
            phoneNumber: prev.zhimpuRestaurant.phoneNumber || prev.phone,
            email: prev.zhimpuRestaurant.email || email || "",
          }
        : prev.zhimpuRestaurant,
    }));
  };

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (locationState.locationError || locationState.locationSuccess) {
      setLocationState({
        isGettingLocation: false,
        locationError: null,
        locationSuccess: false
      });
    }
  };

  const getValidationErrors = () => {
    const newErrors = {};

    if (step === 1 && !listingType) {
      newErrors.listingType = "Please select a listing type";
    }

    if (step === 2) {
      if (!formData.name) newErrors.name = "Business name is required";
      if (!formData.description)
        newErrors.description = "Description is required";
      if (!formData.district) newErrors.district = "District is required";
      if (!formData.locality) newErrors.locality = "Locality/Town is required";
      if (!formData.phone) newErrors.phone = "Phone is required";
      if (formData.photos.length === 0)
        newErrors.photos = "At least one photo is required";
      if (listingType === "hotel") {
        if (!formData.hotelType) newErrors.hotelType = "Hotel type is required";
        if (!formData.checkinTime) newErrors.checkinTime = "Check-in time is required";
        if (!formData.checkoutTime) newErrors.checkoutTime = "Check-out time is required";
        if (!policySelectionType) {
          newErrors.cancellationPolicy = "Please choose how you want to set your cancellation policy";
        } else if (!formData.cancellationPolicy) {
          newErrors.cancellationPolicy = policySelectionType === "predefined"
            ? "Please select a cancellation policy"
            : "Please write your cancellation policy";
        }

        if (formData.hasRestaurant) {
          const r = formData.zhimpuRestaurant;
          if (!r.restaurantName) newErrors["zhimpuRestaurant.restaurantName"] = "Restaurant name is required";
          if (!r.licenseNo) newErrors["zhimpuRestaurant.licenseNo"] = "Restaurant license number is required";
          if (!r.address) newErrors["zhimpuRestaurant.address"] = "Restaurant address is required";
          if (!r.username) newErrors["zhimpuRestaurant.username"] = "Username is required";
          if (!r.email) {
            newErrors["zhimpuRestaurant.email"] = "Email is required";
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) {
            newErrors["zhimpuRestaurant.email"] = "Enter a valid email address";
          }
          if (!r.password) {
            newErrors["zhimpuRestaurant.password"] = "Password is required";
          } else if (r.password.length < 8) {
            newErrors["zhimpuRestaurant.password"] = "Password must be at least 8 characters";
          }
          if (!r.phoneNumber) newErrors["zhimpuRestaurant.phoneNumber"] = "Phone number is required";
        }
      }

      if (!formData.bankType) {
        newErrors.bankType = "Bank type is required";
      }
      if (!formData.accountHolderName) {
        newErrors.accountHolderName = "Account holder name is required";
      } else if (formData.accountHolderName.trim().length < 2) {
        newErrors.accountHolderName = "Account holder name must be at least 2 characters";
      } else if (!/^[a-zA-Z\s\-'\.]+$/.test(formData.accountHolderName.trim())) {
        newErrors.accountHolderName = "Account holder name can only contain letters, spaces, hyphens, apostrophes, and periods";
      }
      if (!formData.accountNumber) {
        newErrors.accountNumber = "Account number is required";
      } else if (!/^\d+$/.test(formData.accountNumber.trim())) {
        newErrors.accountNumber = "Account number must contain only numbers";
      } else if (formData.bankType) {
        const result = validateBankAccountNumber(formData.accountNumber.trim(), formData.bankType);
        if (!result.isValid) {
          newErrors.accountNumber = result.error;
        }
      }
    }

    if (step === 3) {
      if (!formData.license) newErrors.license = "Trade license is required";
      if (!formData.idProof) newErrors.idProof = "ID proof is required";
    }

    return newErrors;
  };

  const validateStep = () => {
    const newErrors = getValidationErrors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    const validationErrors = getValidationErrors();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setTimeout(() => {
        scrollToFirstError(validationErrors);
      }, 150);
      return;
    }

    setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const scrollToFirstError = (errorFields) => {
    if (!errorFields || Object.keys(errorFields).length === 0) return;

    const firstErrorField = Object.keys(errorFields)[0];
    let elementToScroll = null;

    elementToScroll = document.getElementById(firstErrorField) ||
                     document.querySelector(`[name="${firstErrorField}"]`) ||
                     document.querySelector(`input[id="${firstErrorField}"]`) ||
                     document.querySelector(`select[id="${firstErrorField}"]`);

    if (!elementToScroll) {
      const labelElement = document.querySelector(`label[for="${firstErrorField}"]`);
      if (labelElement) {
        const parentContainer = labelElement.closest('.space-y-2');
        if (parentContainer) {
          elementToScroll = parentContainer.querySelector('input, select, textarea, button[role="combobox"]');

          if (!elementToScroll) {
            const selectContent = parentContainer.querySelector('[data-radix-collection-item]')?.closest('div');
            if (selectContent) {
              const selectTrigger = selectContent.parentElement?.querySelector('button');
              if (selectTrigger) elementToScroll = selectTrigger;
            }
          }
        }
      }
    }

    if (elementToScroll) {
      elementToScroll.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });

      setTimeout(() => {
        if (elementToScroll.tagName === 'BUTTON') {
          elementToScroll.focus();
          setTimeout(() => {
            if (elementToScroll.getAttribute('aria-expanded') === 'false') {
            }
          }, 100);
        } else {
          elementToScroll.focus();
          if (elementToScroll.tagName !== 'INPUT' && elementToScroll.tagName !== 'SELECT' && elementToScroll.tagName !== 'TEXTAREA') {
            const innerInput = elementToScroll.querySelector('input, select, textarea');
            if (innerInput) {
              innerInput.focus();
            }
          }
        }
      }, 300);
    } else {
      const labelElement = document.querySelector(`label[for="${firstErrorField}"]`);
      if (labelElement) {
        const container = labelElement.closest('.space-y-2') || labelElement.parentElement;
        if (container) {
          container.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }
    }
  };

  const submitFinalListing = async (e) => {
    e.preventDefault();

    const validationErrors = getValidationErrors();

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setTimeout(() => {
        scrollToFirstError(validationErrors);
      }, 150);
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadPromises = [];

      if (formData.photos.length > 0) {
        formData.photos.forEach((photo) => {
          uploadPromises.push(uploadFile(photo.file, "photos"));
        });
      }

      if (formData.license?.file) {
        uploadPromises.push(uploadFile(formData.license.file, "license"));
      }

      if (formData.idProof?.file) {
        uploadPromises.push(uploadFile(formData.idProof.file, "idProof"));
      }

      const uploadResults = await Promise.all(uploadPromises);
      const updatedFormData = { ...formData, email: `${email}` };

      uploadResults.forEach((result) => {
        if (result.field === "photos") {
          if (!updatedFormData.photoUrls) updatedFormData.photoUrls = [];
          updatedFormData.photoUrls.push(result.url);
        } else if (result.field === "license") {
          updatedFormData.licenseUrl = result.url;
        } else if (result.field === "idProof") {
          updatedFormData.idProofUrl = result.url;
        }
      });

      const res = await api.post(`/hotels/${userId}`, updatedFormData);

      if (res.status === 200) {
        const newHotelId = res.data.id;
        setHotelId(newHotelId);
        setSelectedHotelId(newHotelId);
        setRoles(['GUEST', 'HOTEL_ADMIN']);

        setStorageItem('hotelIds', JSON.stringify([newHotelId]));

        sessionStorage.setItem('newHotelId', newHotelId.toString());
      }
      setIsSubmitted(true);
    } catch (error) {
      // Surface backend business-rule messages (e.g. the one-hotel plan limit)
      // which arrive as HTTP 400 with a `message` field.
      const backendMessage = error?.response?.data?.message;
      if (error?.response?.status === 400 && backendMessage) {
        toast.error(backendMessage, { duration: 6000 });
      } else {
        toast.error(`Submission failed: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success screen ───────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg p-8 text-center">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="text-neutral-900 h-5 w-5" strokeWidth={2.5} />
          </div>
          <h2 className="text-[20px] font-semibold tracking-tight text-neutral-950 mb-2">
            Listing Submitted!
          </h2>
          <p className="text-[13px] text-neutral-500 mb-6 leading-relaxed">
            Your {listingType} listing has been submitted for review. We'll notify you once it's approved.
          </p>

          <div className="text-left border-l-4 border-l-amber-500 bg-amber-50 px-4 py-3 rounded-r-md mb-6">
            <p className="text-[13px] text-amber-800 leading-relaxed">
              <span className="font-semibold">One more step required.</span>{" "}
              Your listing will not go live until you start your free 2-month trial. Start it now to activate your listing.
            </p>
          </div>

          <button
            onClick={() => navigate("/subscription")}
            className="flex items-center justify-center gap-1.5 w-full h-9 rounded-md bg-neutral-950 text-white text-[13px] font-medium hover:opacity-85 transition-opacity"
          >
            Start Your Free Trial <ArrowRight className="h-[13px] w-[13px]" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Section header helper ────────────────────────────────────────────────
  const SectionHeader = ({ title, subtitle }) => (
    <div className="px-5 py-3.5 border-b border-neutral-100 bg-white">
      <h3 className="text-[13px] font-medium text-neutral-900">{title}</h3>
      {subtitle && <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{subtitle}</p>}
    </div>
  );

  // ─── Plan gate: still checking ────────────────────────────────────────────
  if (planGateChecking) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  // ─── Plan gate: blocked (non-PRO owner already has a hotel) ────────────────
  if (planBlocked) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-white border border-neutral-200 rounded-lg p-9">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-neutral-100 rounded px-2 py-0.5 mb-4">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-900">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-900">Pro Plan</span>
          </div>

          {/* Heading + description */}
          <h2 className="text-[20px] font-semibold tracking-tight leading-snug text-neutral-950 mb-2.5">
            Multiple hotels require the Pro plan
          </h2>
          <p className="text-[13px] text-neutral-500 leading-relaxed mb-0">
            Your current plan supports one property. Upgrade to add and manage multiple hotels, staff, and analytics from a single account.
          </p>

          {/* Divider */}
          <div className="border-t border-neutral-200 my-6" />

          {/* Feature list */}
          <div className="flex flex-col gap-2.5 mb-5">
            {[
              { title: "Unlimited hotels", detail: "list and manage as many properties as you own" },
              { title: "Unlimited rooms & staff", detail: "no cap on rooms or team members per property" },
              { title: "Analytics & reporting", detail: "revenue trends, occupancy rates, leave management" },
            ].map(({ title, detail }) => (
              <div key={title} className="flex items-start gap-2.5">
                <Check className="h-[15px] w-[15px] text-neutral-900 mt-[1px] flex-shrink-0" strokeWidth={2.5} />
                <span className="text-[13px] text-neutral-500 leading-snug">
                  <span className="font-medium text-neutral-900">{title}</span> — {detail}
                </span>
              </div>
            ))}
          </div>

          {/* Price row */}
          <div className="flex items-baseline gap-1.5 bg-neutral-50 border border-neutral-200 rounded-md px-3.5 py-3 mb-6">
            <span className="text-[22px] font-bold tracking-tighter text-neutral-950 tabular-nums">Nu. 1999</span>
            <span className="text-[13px] font-medium text-neutral-500">/ month</span>
            <span className="text-[12px] text-neutral-400 ml-auto tabular-nums">billed monthly</span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate("/subscription")}
              className="flex items-center justify-center gap-1.5 w-full h-9 rounded-md bg-neutral-950 text-white text-[13px] font-medium tracking-tight border border-neutral-950 hover:opacity-85 transition-opacity"
            >
              Upgrade to Pro
              <ArrowRight className="h-[13px] w-[13px]" />
            </button>
            <button
              onClick={() => navigate("/hotelAdmin")}
              className="flex items-center justify-center w-full h-9 rounded-md bg-white text-neutral-600 text-[13px] font-medium tracking-tight border border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center justify-center w-7 h-7 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-neutral-500 hover:text-neutral-900"
                aria-label="Go back"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                to="/"
                className="flex items-center justify-center w-7 h-7 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-neutral-500 hover:text-neutral-900"
                aria-label="Cancel"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            )}
            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest">
              Step {step} of {stepInfo.length}
            </p>
          </div>
          <h1 className="text-[24px] font-semibold tracking-tight text-neutral-950">
            {stepInfo[step - 1].title}
          </h1>
          <p className="text-[13px] text-neutral-500 mt-1">
            {stepInfo[step - 1].description}
          </p>
        </div>

        {/* Step progress */}
        <nav aria-label="Progress" className="mb-8">
          <div className="flex items-center">
            {stepInfo.map((info, index) => {
              const stepNumber = index + 1;
              const isActive = step === stepNumber;
              const isCompleted = step > stepNumber;

              return (
                <React.Fragment key={info.title}>
                  <div className="flex flex-col items-center">
                    <div className={`
                      flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-300
                      ${isCompleted
                        ? 'bg-neutral-950 text-white'
                        : isActive
                        ? 'bg-neutral-950 text-white ring-4 ring-neutral-200'
                        : 'bg-white border border-neutral-200 text-neutral-400'
                      }
                    `}>
                      {isCompleted ? <Check className="h-3 w-3" strokeWidth={2.5} /> : stepNumber}
                    </div>
                    <span className={`
                      text-[11px] mt-1.5 font-medium transition-colors hidden sm:block
                      ${isActive ? 'text-neutral-950' : isCompleted ? 'text-neutral-600' : 'text-neutral-400'}
                    `}>
                      {info.title}
                    </span>
                  </div>
                  {index < stepInfo.length - 1 && (
                    <div className={`
                      flex-1 h-px mx-2 transition-colors duration-300 mb-5 sm:mb-4
                      ${step > stepNumber ? 'bg-neutral-900' : 'bg-neutral-200'}
                    `} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </nav>

        {/* ── Step 1: Choose listing type ────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            {errors.listingType && (
              <div className="flex items-center gap-2 border-l-4 border-l-red-500 bg-red-50 px-4 py-3 rounded-r-md text-[13px] text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errors.listingType}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {listingTypes.map((type) => {
                const IconComponent = type.icon;
                const isDisabled = type.disabled;
                const isSelected = listingType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && handleListingTypeChange(type.id)}
                    className={`
                      relative text-left rounded-lg border p-5 transition-all duration-200 focus:outline-none
                      ${isDisabled
                        ? 'opacity-40 cursor-not-allowed border-neutral-200 bg-neutral-50'
                        : isSelected
                        ? 'border-neutral-950 bg-neutral-50'
                        : 'border-neutral-200 bg-white hover:border-neutral-400 cursor-pointer'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-neutral-950 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                      </div>
                    )}
                    <div className={`
                      w-9 h-9 rounded-md flex items-center justify-center mb-3
                      ${isDisabled ? 'bg-neutral-100 text-neutral-400' : isSelected ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-500'}
                    `}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <h3 className={`font-medium text-[14px] mb-1 ${isDisabled ? 'text-neutral-400' : 'text-neutral-900'}`}>
                      {type.label}
                      {isDisabled && <span className="ml-2 text-[12px] font-normal text-neutral-400">(Coming Soon)</span>}
                    </h3>
                    <p className="text-[12px] text-neutral-500 leading-relaxed">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Business Details ───────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">

            {/* Basic Information */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <SectionHeader title="Basic Information" subtitle="Core details about your business" />
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[12px] font-medium text-neutral-700">
                    Business Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your business name"
                    className={errors.name ? "border-red-400" : ""}
                  />
                  {errors.name && <p className="text-red-500 text-[12px]">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[12px] font-medium text-neutral-700">
                    Business Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe your business, services, and what makes it unique..."
                    className={`resize-none text-[13px] ${errors.description ? "border-red-400" : ""}`}
                  />
                  {errors.description && <p className="text-red-500 text-[12px]">{errors.description}</p>}
                </div>
              </div>
            </div>

            {/* Location & Contact */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <SectionHeader title="Location & Contact" subtitle="Where your business is located and how guests reach you" />
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[12px] font-medium text-neutral-700">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`pl-9 ${errors.phone ? "border-red-400" : ""}`}
                      placeholder="Enter your contact number"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-[12px]">{errors.phone}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-[12px] font-medium text-neutral-700">
                      District <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.district}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, district: value, locality: "" }));
                        if (errors.district) setErrors(prev => { const e = { ...prev }; delete e.district; return e; });
                        if (errors.locality) setErrors(prev => { const e = { ...prev }; delete e.locality; return e; });
                      }}
                    >
                      <SelectTrigger className={errors.district ? "border-red-400" : ""}>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.district && <p className="text-red-500 text-[12px]">{errors.district}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locality" className="text-[12px] font-medium text-neutral-700">
                      Town / Locality <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.locality}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, locality: value }));
                        if (errors.locality) setErrors(prev => { const e = { ...prev }; delete e.locality; return e; });
                      }}
                      disabled={!formData.district}
                    >
                      <SelectTrigger className={errors.locality ? "border-red-400" : ""}>
                        <SelectValue placeholder={formData.district ? "Select town/locality" : "Select district first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.district && getLocalitiesForDistrict(formData.district).map((locality) => (
                          <SelectItem key={locality} value={locality}>{locality}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.locality && <p className="text-red-500 text-[12px]">{errors.locality}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-[12px] font-medium text-neutral-700">
                    Detailed Address <span className="text-neutral-400 text-[11px] font-normal">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="pl-9"
                      placeholder="Street address, building name, or landmarks"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* GPS Location */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <SectionHeader title="GPS Location" subtitle="Precise coordinates for better guest navigation" />
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-neutral-900">Auto-detect location</p>
                    <p className="text-[12px] text-neutral-500 mt-0.5">Use your device GPS to fill coordinates automatically</p>
                  </div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationState.isGettingLocation}
                    className="flex items-center gap-1.5 h-8 px-3.5 rounded-md border border-neutral-200 bg-white text-neutral-600 text-[12px] font-medium hover:bg-neutral-50 hover:text-neutral-900 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {locationState.isGettingLocation ? (
                      <><Spinner size="sm" /> Getting location...</>
                    ) : (
                      <><Navigation className="h-3.5 w-3.5" /> Use Current Location</>
                    )}
                  </button>
                </div>

                {locationState.locationError && (
                  <div className="border-l-4 border-l-red-500 bg-red-50 px-4 py-3 rounded-r-md">
                    <p className="text-[13px] text-red-700 mb-2">{locationState.locationError}</p>
                    <ul className="text-[12px] text-red-600 space-y-0.5 list-disc list-inside">
                      <li>Ensure GPS is enabled on your device</li>
                      <li>Check browser location permissions</li>
                      <li>Try refreshing and allowing location access</li>
                    </ul>
                  </div>
                )}

                {locationState.locationSuccess && (
                  <div className="border-l-4 border-l-emerald-500 bg-emerald-50 px-4 py-2.5 rounded-r-md flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <p className="text-[13px] text-emerald-700 font-medium">Location captured successfully!</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude" className="text-[12px] font-medium text-neutral-700">
                      Latitude <span className="text-neutral-400 text-[11px] font-normal">(Auto-filled)</span>
                    </Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={handleCoordinateChange}
                      placeholder="e.g., 27.4728"
                      className={formData.latitude ? "border-emerald-400" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude" className="text-[12px] font-medium text-neutral-700">
                      Longitude <span className="text-neutral-400 text-[11px] font-normal">(Auto-filled)</span>
                    </Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={handleCoordinateChange}
                      placeholder="e.g., 89.6386"
                      className={formData.longitude ? "border-emerald-400" : ""}
                    />
                  </div>
                </div>

                {areCoordinatesValid() && (
                  <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2.5">
                    <MapPin className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                    <p className="text-[13px] text-neutral-700 font-medium">
                      {formData.latitude}, {formData.longitude}
                    </p>
                  </div>
                )}

                <p className="text-[12px] text-neutral-400">
                  You can also enter coordinates manually for more accuracy.
                </p>
              </div>
            </div>

            {/* Hotel-specific details */}
            {listingType === "hotel" && (
              <>
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                  <SectionHeader title="Hotel Details" subtitle="Specific information for hotel operations" />
                  <div className="p-5 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="hotelType" className="text-[12px] font-medium text-neutral-700">
                        Hotel Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.hotelType}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, hotelType: value }));
                          if (errors.hotelType) setErrors(prev => { const e = { ...prev }; delete e.hotelType; return e; });
                        }}
                      >
                        <SelectTrigger className={errors.hotelType ? "border-red-400" : ""}>
                          <SelectValue placeholder="Select hotel type" />
                        </SelectTrigger>
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
                      {errors.hotelType && <p className="text-red-500 text-[12px]">{errors.hotelType}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkinTime" className="text-[12px] font-medium text-neutral-700">
                          Check-in Time <span className="text-red-500">*</span>
                        </Label>
                        <TimePicker
                          id="checkinTime"
                          name="checkinTime"
                          value={formData.checkinTime}
                          onChange={handleChange}
                          placeholder="Select check-in time"
                          format24h={false}
                          error={!!errors.checkinTime}
                        />
                        {errors.checkinTime && <p className="text-red-500 text-[12px]">{errors.checkinTime}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="checkoutTime" className="text-[12px] font-medium text-neutral-700">
                          Check-out Time <span className="text-red-500">*</span>
                        </Label>
                        <TimePicker
                          id="checkoutTime"
                          name="checkoutTime"
                          value={formData.checkoutTime}
                          onChange={handleChange}
                          placeholder="Select check-out time"
                          format24h={false}
                          error={!!errors.checkoutTime}
                        />
                        {errors.checkoutTime && <p className="text-red-500 text-[12px]">{errors.checkoutTime}</p>}
                      </div>
                    </div>

                    {/* Hourly booking toggle */}
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="hasTimeBased"
                          className="mt-0.5 h-4 w-4"
                          checked={formData.hasTimeBased}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({ ...prev, hasTimeBased: checked }));
                          }}
                        />
                        <div>
                          <label htmlFor="hasTimeBased" className="text-[13px] font-medium text-neutral-900 cursor-pointer">
                            Enable Hourly Booking
                          </label>
                          <p className="text-[12px] text-neutral-500 mt-0.5">
                            Allow guests to book rooms for specific hours instead of full days
                          </p>
                        </div>
                      </div>

                      {formData.hasTimeBased && (
                        <div className="ml-7 bg-white rounded-md px-3 py-2.5 border border-neutral-200">
                          <p className="text-[12px] font-medium text-neutral-700 mb-1.5">Hourly booking features:</p>
                          <ul className="text-[12px] text-neutral-500 space-y-1">
                            <li>• Guests can book rooms for 1–24 hours</li>
                            <li>• Pricing calculated per hour instead of per day</li>
                            <li>• Ideal for short stays, meetings, or day use</li>
                            <li>• Can be used alongside regular daily bookings</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Restaurant registration (Zhimpu) - temporarily disabled for production */}
                {false && (
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                  <SectionHeader title="Restaurant" subtitle="Register a restaurant attached to this hotel with Zhimpu" />
                  <div className="p-5 space-y-4">
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="hasRestaurant"
                          className="mt-0.5 h-4 w-4"
                          checked={formData.hasRestaurant}
                          onCheckedChange={handleHasRestaurantToggle}
                        />
                        <div>
                          <label htmlFor="hasRestaurant" className="text-[13px] font-medium text-neutral-900 cursor-pointer">
                            Do you have a restaurant?
                          </label>
                          <p className="text-[12px] text-neutral-500 mt-0.5">
                            We'll register it with Zhimpu so it can be managed alongside your hotel.
                          </p>
                        </div>
                      </div>

                      {formData.hasRestaurant && (
                        <div className="ml-7 bg-white rounded-md px-4 py-4 border border-neutral-200 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="zhimpuRestaurant.restaurantName" className="text-[12px] font-medium text-neutral-700">
                              Restaurant Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="zhimpuRestaurant.restaurantName"
                              name="restaurantName"
                              value={formData.zhimpuRestaurant.restaurantName}
                              onChange={handleZhimpuRestaurantChange}
                              placeholder="Enter the restaurant's name"
                              className={errors["zhimpuRestaurant.restaurantName"] ? "border-red-400" : ""}
                            />
                            {errors["zhimpuRestaurant.restaurantName"] && (
                              <p className="text-red-500 text-[12px]">{errors["zhimpuRestaurant.restaurantName"]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="zhimpuRestaurant.licenseNo" className="text-[12px] font-medium text-neutral-700">
                              License Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="zhimpuRestaurant.licenseNo"
                              name="licenseNo"
                              value={formData.zhimpuRestaurant.licenseNo}
                              onChange={handleZhimpuRestaurantChange}
                              placeholder="e.g., BT-12345"
                              className={errors["zhimpuRestaurant.licenseNo"] ? "border-red-400" : ""}
                            />
                            {errors["zhimpuRestaurant.licenseNo"] && (
                              <p className="text-red-500 text-[12px]">{errors["zhimpuRestaurant.licenseNo"]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="zhimpuRestaurant.address" className="text-[12px] font-medium text-neutral-700">
                              Address <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="zhimpuRestaurant.address"
                              name="address"
                              value={formData.zhimpuRestaurant.address}
                              onChange={handleZhimpuRestaurantChange}
                              placeholder="Restaurant address"
                              className={errors["zhimpuRestaurant.address"] ? "border-red-400" : ""}
                            />
                            {errors["zhimpuRestaurant.address"] && (
                              <p className="text-red-500 text-[12px]">{errors["zhimpuRestaurant.address"]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="zhimpuRestaurant.tpn" className="text-[12px] font-medium text-neutral-700">
                              TPN <span className="text-neutral-400 text-[11px] font-normal">(Optional)</span>
                            </Label>
                            <Input
                              id="zhimpuRestaurant.tpn"
                              name="tpn"
                              value={formData.zhimpuRestaurant.tpn}
                              onChange={handleZhimpuRestaurantChange}
                              placeholder="Tax Payer Number, if any"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="zhimpuRestaurant.username" className="text-[12px] font-medium text-neutral-700">
                                Username <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="zhimpuRestaurant.username"
                                name="username"
                                value={formData.zhimpuRestaurant.username}
                                onChange={handleZhimpuRestaurantChange}
                                placeholder="Login username for Zhimpu"
                                autoComplete="off"
                                className={errors["zhimpuRestaurant.username"] ? "border-red-400" : ""}
                              />
                              {errors["zhimpuRestaurant.username"] && (
                                <p className="text-red-500 text-[12px]">{errors["zhimpuRestaurant.username"]}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="zhimpuRestaurant.password" className="text-[12px] font-medium text-neutral-700">
                                Password <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <Input
                                  id="zhimpuRestaurant.password"
                                  name="password"
                                  type={showZhimpuPassword ? "text" : "password"}
                                  value={formData.zhimpuRestaurant.password}
                                  onChange={handleZhimpuRestaurantChange}
                                  placeholder="At least 8 characters"
                                  autoComplete="new-password"
                                  className={`pr-9 ${errors["zhimpuRestaurant.password"] ? "border-red-400" : ""}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowZhimpuPassword((prev) => !prev)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                  aria-label={showZhimpuPassword ? "Hide password" : "Show password"}
                                  tabIndex={-1}
                                >
                                  {showZhimpuPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                              {errors["zhimpuRestaurant.password"] && (
                                <p className="text-red-500 text-[12px]">{errors["zhimpuRestaurant.password"]}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="zhimpuRestaurant.email" className="text-[12px] font-medium text-neutral-700">
                                Email <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                                <Input
                                  id="zhimpuRestaurant.email"
                                  name="email"
                                  type="email"
                                  value={formData.zhimpuRestaurant.email}
                                  onChange={handleZhimpuRestaurantChange}
                                  placeholder="admin@example.bt"
                                  className={`pl-9 ${errors["zhimpuRestaurant.email"] ? "border-red-400" : ""}`}
                                />
                              </div>
                              {errors["zhimpuRestaurant.email"] && (
                                <p className="text-red-500 text-[12px]">{errors["zhimpuRestaurant.email"]}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="zhimpuRestaurant.phoneNumber" className="text-[12px] font-medium text-neutral-700">
                                Phone Number <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                                <Input
                                  id="zhimpuRestaurant.phoneNumber"
                                  name="phoneNumber"
                                  type="tel"
                                  value={formData.zhimpuRestaurant.phoneNumber}
                                  onChange={handleZhimpuRestaurantChange}
                                  placeholder="17123456"
                                  className={`pl-9 ${errors["zhimpuRestaurant.phoneNumber"] ? "border-red-400" : ""}`}
                                />
                              </div>
                              {errors["zhimpuRestaurant.phoneNumber"] && (
                                <p className="text-red-500 text-[12px]">{errors["zhimpuRestaurant.phoneNumber"]}</p>
                              )}
                            </div>
                          </div>

                          <p className="text-[12px] text-neutral-400">
                            We register your restaurant with Zhimpu first — your hotel listing is only created after that succeeds.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}

                {/* Cancellation Policy */}
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                  <SectionHeader title="Cancellation Policy" subtitle="Define the refund rules guests will see at booking" />
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <label className={`
                        flex items-center gap-2.5 cursor-pointer rounded-lg border px-4 py-3 flex-1 transition-colors
                        ${policySelectionType === 'predefined' ? 'border-neutral-950 bg-neutral-50' : 'border-neutral-200 bg-white hover:border-neutral-400'}
                      `}>
                        <input
                          type="radio"
                          name="policyType"
                          value="predefined"
                          checked={policySelectionType === "predefined"}
                          onChange={(e) => {
                            setPolicySelectionType(e.target.value);
                            if (errors.cancellationPolicy) setErrors(prev => { const e = { ...prev }; delete e.cancellationPolicy; return e; });
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-[13px] font-medium text-neutral-900">Choose a common policy</span>
                      </label>
                      <label className={`
                        flex items-center gap-2.5 cursor-pointer rounded-lg border px-4 py-3 flex-1 transition-colors
                        ${policySelectionType === 'custom' ? 'border-neutral-950 bg-neutral-50' : 'border-neutral-200 bg-white hover:border-neutral-400'}
                      `}>
                        <input
                          type="radio"
                          name="policyType"
                          value="custom"
                          checked={policySelectionType === "custom"}
                          onChange={(e) => {
                            setPolicySelectionType(e.target.value);
                            if (errors.cancellationPolicy) setErrors(prev => { const e = { ...prev }; delete e.cancellationPolicy; return e; });
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-[13px] font-medium text-neutral-900">Write custom policy</span>
                      </label>
                    </div>

                    {policySelectionType === "predefined" && (
                      <div className="space-y-3">
                        <Select
                          value={formData.cancellationPolicy}
                          onValueChange={(value) => {
                            const selected = cancellationPolicyOptions.find(o => o.id === value);
                            setFormData(prev => ({ ...prev, cancellationPolicy: selected ? selected.description : value }));
                            if (errors.cancellationPolicy) setErrors(prev => { const e = { ...prev }; delete e.cancellationPolicy; return e; });
                          }}
                        >
                          <SelectTrigger className={errors.cancellationPolicy ? "border-red-400" : ""}>
                            <SelectValue placeholder="Select a cancellation policy" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[60vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-auto max-w-[calc(100vw-2rem)] sm:max-w-none">
                            {cancellationPolicyOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id} className="py-3">
                                <div className="space-y-1 w-full min-w-0">
                                  <div className="font-medium text-sm leading-tight">{option.label}</div>
                                  <div className="text-xs text-muted-foreground leading-relaxed pr-2">{option.description}</div>
                                  {option.refundBreakdown && (
                                    <div className="mt-2 overflow-x-auto">
                                      <div className="flex gap-1 min-w-max">
                                        {option.refundBreakdown.map((item, index) => (
                                          <span key={index} className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                                            item.refund === "100%"
                                              ? "bg-green-100 text-green-700"
                                              : item.refund === "0%"
                                              ? "bg-red-100 text-red-700"
                                              : "bg-yellow-100 text-yellow-700"
                                          }`}>
                                            {item.refund}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {formData.cancellationPolicy && (() => {
                          const selected = cancellationPolicyOptions.find(o => o.description === formData.cancellationPolicy);
                          if (!selected) return null;
                          return (
                            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-neutral-700 mt-0.5 shrink-0" />
                                <div className="text-[13px]">
                                  <p className="font-medium text-neutral-900">{selected.label}</p>
                                  <p className="text-neutral-500 mt-0.5 text-[12px] leading-relaxed">{formData.cancellationPolicy}</p>
                                </div>
                              </div>
                              {selected.refundBreakdown && (
                                <div className="border-t border-neutral-200 pt-3">
                                  <p className="text-[12px] font-medium text-neutral-700 mb-2">Refund breakdown:</p>
                                  <div className="space-y-1.5">
                                    {selected.refundBreakdown.map((item, index) => (
                                      <div key={index} className="flex items-center justify-between gap-2 text-[12px]">
                                        <span className="text-neutral-500">{item.timeframe}</span>
                                        <span className={`font-medium px-2 py-0.5 rounded shrink-0 ${
                                          item.refund === "100%"
                                            ? "bg-green-100 text-green-800"
                                            : item.refund === "0%"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-yellow-100 text-yellow-800"
                                        }`}>
                                          {item.refund}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {policySelectionType === "custom" && (
                      <div className="space-y-3">
                        <Textarea
                          id="cancellationPolicy"
                          name="cancellationPolicy"
                          value={formData.cancellationPolicy}
                          onChange={handleChange}
                          rows={4}
                          placeholder="e.g., Free cancellation up to 24 hours before check-in. Cancellations within 24 hours will be charged 50% of the total amount. No-shows charged in full."
                          className={`resize-none text-[13px] ${errors.cancellationPolicy ? "border-red-400" : ""}`}
                        />
                        <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                          <p className="text-[12px] font-medium text-neutral-700 mb-1.5">Tips for an effective policy:</p>
                          <ul className="text-[12px] text-neutral-500 space-y-1 list-disc list-inside">
                            <li>Be specific about timeframes (hours, days)</li>
                            <li>Clearly state refund percentages</li>
                            <li>Include no-show policies</li>
                            <li>Consider seasonal variations</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {errors.cancellationPolicy && (
                      <p className="text-red-500 text-[12px]">{errors.cancellationPolicy}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Amenities */}
            {currentAmenities.length > 0 && (
              <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                <SectionHeader title="Amenities & Features" subtitle="Select the amenities your business offers" />
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                    {currentAmenities.map((amenity) => (
                      <label
                        key={amenity}
                        htmlFor={`amenity-${amenity}`}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <Checkbox
                          id={`amenity-${amenity}`}
                          checked={formData.amenities.includes(amenity)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({ ...prev, amenities: [...prev.amenities, amenity] }));
                            } else {
                              setFormData(prev => ({ ...prev, amenities: prev.amenities.filter(item => item !== amenity) }));
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-[13px] text-neutral-700 group-hover:text-neutral-950 transition-colors">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <SectionHeader title="Payment Details" subtitle="Bank account for receiving payments" />
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankType" className="text-[12px] font-medium text-neutral-700">
                      Bank <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.bankType}
                      onValueChange={(value) => {
                        const maxLen = getMaxAccountNumberLength(value) || 20;
                        setFormData(prev => ({ ...prev, bankType: value, accountNumber: (prev.accountNumber || "").slice(0, maxLen) }));
                        if (errors.bankType) setErrors(prev => { const e = { ...prev }; delete e.bankType; return e; });
                      }}
                    >
                      <SelectTrigger className={errors.bankType ? "border-red-400" : ""}>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
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
                    {errors.bankType && <p className="text-red-500 text-[12px]">{errors.bankType}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountHolderName" className="text-[12px] font-medium text-neutral-700">
                      Account Holder Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="accountHolderName"
                      name="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={handleChange}
                      placeholder="As per bank records"
                      className={errors.accountHolderName ? "border-red-400" : ""}
                    />
                    {errors.accountHolderName && <p className="text-red-500 text-[12px]">{errors.accountHolderName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber" className="text-[12px] font-medium text-neutral-700">
                      Account Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      type="text"
                      inputMode="numeric"
                      maxLength={getMaxAccountNumberLength(formData.bankType) || 20}
                      value={formData.accountNumber}
                      onChange={handleChange}
                      placeholder="Enter account number"
                      className={errors.accountNumber ? "border-red-400" : ""}
                    />
                    {errors.accountNumber && <p className="text-red-500 text-[12px]">{errors.accountNumber}</p>}
                  </div>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-md px-4 py-3">
                  <p className="text-[12px] font-medium text-neutral-700 mb-0.5">Security notice</p>
                  <p className="text-[12px] text-neutral-500 leading-relaxed">
                    Your bank details are encrypted and used only for payment processing. Ensure the account holder name matches your business registration.
                  </p>
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <SectionHeader title="Business Photos" subtitle="Upload photos to showcase your property" />
              <div className="p-5 space-y-4">
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={photo.url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-md border border-neutral-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label
                  htmlFor="photos"
                  className={`
                    block border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 group
                    ${formData.photos.length >= 5
                      ? 'opacity-50 cursor-not-allowed border-neutral-200'
                      : errors.photos
                      ? 'border-red-300 hover:border-red-400'
                      : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                    }
                  `}
                >
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center mb-3 group-hover:bg-neutral-200 transition-colors">
                      <Camera className="h-4 w-4 text-neutral-500" />
                    </div>
                    <p className="text-[13px] font-medium text-neutral-900">
                      {formData.photos.length >= 5 ? 'Maximum photos reached' : 'Click to upload photos'}
                    </p>
                    <p className="text-[12px] text-neutral-500 mt-1">
                      JPG, PNG · Max 4MB per file · Up to {5 - formData.photos.length} more photo{5 - formData.photos.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Input
                    id="photos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={formData.photos.length >= 5}
                  />
                </label>

                {errors.photos && <p className="text-red-500 text-[12px]">{errors.photos}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Verification Documents ────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-neutral-50 border border-neutral-200 rounded-md px-4 py-3">
              <p className="text-[13px] text-neutral-500 leading-relaxed">
                Upload the required documents for verification. Your listing will be reviewed within 24 hours.
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <SectionHeader title="Trade License" subtitle="Official business trade license" />
              <div className="p-5 space-y-3">
                <label
                  htmlFor="license"
                  className={`
                    block border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 group
                    ${formData.license
                      ? 'border-neutral-300 bg-neutral-50'
                      : errors.license
                      ? 'border-red-300 hover:border-red-400'
                      : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                    }
                  `}
                >
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3 transition-colors ${formData.license ? 'bg-neutral-200' : 'bg-neutral-100 group-hover:bg-neutral-200'}`}>
                      {formData.license
                        ? <CheckCircle className="h-4 w-4 text-neutral-700" />
                        : <Upload className="h-4 w-4 text-neutral-500" />
                      }
                    </div>
                    <p className="text-[13px] font-medium text-neutral-900">
                      {formData.license ? formData.license.name : 'Click to upload trade license'}
                    </p>
                    <p className="text-[12px] text-neutral-500 mt-1">PDF or Image · Max 4MB</p>
                  </div>
                  <Input
                    id="license"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "license")}
                    className="hidden"
                  />
                </label>
                {errors.license && <p className="text-red-500 text-[12px]">{errors.license}</p>}
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <SectionHeader title="ID Proof" subtitle="Citizen ID card or passport" />
              <div className="p-5 space-y-3">
                <label
                  htmlFor="idProof"
                  className={`
                    block border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 group
                    ${formData.idProof
                      ? 'border-neutral-300 bg-neutral-50'
                      : errors.idProof
                      ? 'border-red-300 hover:border-red-400'
                      : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                    }
                  `}
                >
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3 transition-colors ${formData.idProof ? 'bg-neutral-200' : 'bg-neutral-100 group-hover:bg-neutral-200'}`}>
                      {formData.idProof
                        ? <CheckCircle className="h-4 w-4 text-neutral-700" />
                        : <Upload className="h-4 w-4 text-neutral-500" />
                      }
                    </div>
                    <p className="text-[13px] font-medium text-neutral-900">
                      {formData.idProof ? formData.idProof.name : 'Click to upload ID proof'}
                    </p>
                    <p className="text-[12px] text-neutral-500 mt-1">PDF or Image · Max 4MB</p>
                  </div>
                  <Input
                    id="idProof"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "idProof")}
                    className="hidden"
                  />
                </label>
                {errors.idProof && <p className="text-red-500 text-[12px]">{errors.idProof}</p>}
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <SectionHeader title="Additional Notes" subtitle="Any extra information for our review team" />
              <div className="p-5">
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any additional information about your business..."
                  className="resize-none text-[13px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Review & Submit ────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-neutral-50 border border-neutral-200 rounded-md px-4 py-3">
              <p className="text-[13px] text-neutral-500">Review your information carefully before submitting. You can go back to make changes.</p>
            </div>

            {/* Listing type */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <SectionHeader title="Listing Type" />
              <div className="p-5">
                <span className="inline-flex items-center h-6 px-2.5 rounded-md bg-neutral-100 text-[12px] font-medium text-neutral-700">
                  {listingType.charAt(0).toUpperCase() + listingType.slice(1)}
                </span>
              </div>
            </div>

            {/* Business info */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <SectionHeader title="Business Information" />
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <ReviewField label="Business Name" value={formData.name} />
                  <ReviewField label="Location" value={`${formData.locality}, ${formData.district}`} />
                  {formData.address && <ReviewField label="Address" value={formData.address} />}
                  <ReviewField label="Email" value={email} />
                  <ReviewField label="Phone" value={formData.phone} />
                  {formData.hotelType && <ReviewField label="Hotel Type" value={formData.hotelType.replace(/_/g, " ")} />}
                  {formData.checkinTime && <ReviewField label="Check-in" value={formData.checkinTime} />}
                  {formData.checkoutTime && <ReviewField label="Check-out" value={formData.checkoutTime} />}
                  {formData.hasTimeBased !== undefined && <ReviewField label="Hourly Booking" value={formData.hasTimeBased ? "Enabled" : "Disabled"} />}
                </div>

                {formData.description && (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-widest mb-1.5">Description</p>
                    <p className="text-[13px] text-neutral-700 leading-relaxed">{formData.description}</p>
                  </div>
                )}

                {formData.cancellationPolicy && (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-widest mb-1.5">Cancellation Policy</p>
                    <p className="text-[13px] text-neutral-700 leading-relaxed">{formData.cancellationPolicy}</p>
                  </div>
                )}

                {areCoordinatesValid() && (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-widest mb-1.5">GPS Coordinates</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                      <p className="text-[13px] text-neutral-700">{formData.latitude}, {formData.longitude}</p>
                    </div>
                  </div>
                )}

                {formData.amenities.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-widest mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.amenities.map((amenity) => (
                        <span key={amenity} className="inline-flex items-center h-6 px-2.5 rounded-md border border-neutral-200 text-[12px] text-neutral-600">{amenity}</span>
                      ))}
                    </div>
                  </div>
                )}

                {formData.photos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-widest mb-2">
                      Photos ({formData.photos.length})
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {formData.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-md border border-neutral-200"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {formData.hasRestaurant && (
              <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                <SectionHeader title="Restaurant (Zhimpu)" />
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    <ReviewField label="Restaurant Name" value={formData.zhimpuRestaurant.restaurantName} />
                    <ReviewField label="License Number" value={formData.zhimpuRestaurant.licenseNo} />
                    <ReviewField label="Address" value={formData.zhimpuRestaurant.address} />
                    {formData.zhimpuRestaurant.tpn && <ReviewField label="TPN" value={formData.zhimpuRestaurant.tpn} />}
                    <ReviewField label="Username" value={formData.zhimpuRestaurant.username} />
                    <ReviewField label="Email" value={formData.zhimpuRestaurant.email} />
                    <ReviewField label="Phone" value={formData.zhimpuRestaurant.phoneNumber} />
                  </div>
                </div>
              </div>
            )}

            {/* Verification documents */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <SectionHeader title="Verification Documents" />
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReviewField label="Trade License" value={formData.license?.name || "Not uploaded"} />
                  <ReviewField label="ID Proof" value={formData.idProof?.name || "Not uploaded"} />
                </div>
                {formData.notes && (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-widest mb-1.5">Additional Notes</p>
                    <p className="text-[13px] text-neutral-700 leading-relaxed">{formData.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment info */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <SectionHeader title="Payment Details" />
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ReviewField label="Bank" value={formData.bankType} />
                  <ReviewField label="Account Holder" value={formData.accountHolderName} />
                  <ReviewField label="Account Number" value={formData.accountNumber} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-5 border-t border-neutral-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 h-9 px-4 rounded-md border border-neutral-200 bg-white text-neutral-600 text-[13px] font-medium hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : (
            <Link
              to="/"
              className="flex items-center h-9 px-4 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Cancel
            </Link>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={step === 1 && !listingType}
              className="flex items-center gap-2 h-9 px-5 rounded-md bg-neutral-950 text-white text-[13px] font-medium hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              onClick={submitFinalListing}
              disabled={isSubmitting}
              className="flex items-center gap-2 h-9 px-5 rounded-md bg-neutral-950 text-white text-[13px] font-medium hover:opacity-85 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" /> Submitting...</>
              ) : (
                <>Submit Listing <Check className="h-3.5 w-3.5" /></>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

// Small helper — only rendered, no logic
const ReviewField = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-[13px] text-neutral-900 font-medium">{value}</p>
  </div>
);

export default AddListingPage;
