import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/dropdown-menu";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  Phone,
  Mail,
  Users,
  AlertCircle,
  MoreVertical,
  XCircle,
  Pencil,
} from "lucide-react";
import api from "../../shared/services/Api";
import ProUpgradeDialog from "../../shared/components/ProUpgradeDialog";

// Validation utilities
const validators = {
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
  },
  phone: {
    regex: /^[\+]?[1-9][\d]{7,15}$/,
    message: "Please enter a valid phone number",
  },
};

const getInitials = (name) => {
  if (!name) return 'ST';
  return name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const STAFF_LIMIT = 2;

const StaffManager = ({ hotelId, subscriptionPlan }) => {
  const isLimitedPlan = subscriptionPlan === 'BASIC' || subscriptionPlan === 'TRIAL';
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
    position: "Front Desk",
    dateJoined: new Date().toISOString().split('T')[0],
  });
  const [formErrors, setFormErrors] = useState({});

  const staffPositions = [
    "frontdesk",
    "Housekeeping",
    "Manager",
    "Concierge",
    "Security",
    "Maintenance",
    "Chef",
    "Porter",
    "Waiter",
    "Bellhop",
    "Other",
  ];

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/staff/hotel/${hotelId}`);
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      let errorMessage = "Failed to load staff members";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        const responseData = error.response.data;
        if (responseData.error === "Internal Server Error" && responseData.status === 500) {
          errorMessage = "The server encountered an unexpected error while loading staff members. Please try again in a few moments.";
        } else {
          errorMessage = `Server error: ${responseData.error}`;
        }
      } else if (error.response?.status === 500) {
        errorMessage = "The server encountered an unexpected error. Please try again in a few moments.";
      }
      setError(errorMessage);
      toast.error("Failed to load staff members. Please try again.", { duration: 6000 });
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    if (hotelId) fetchStaff();
  }, [fetchStaff, hotelId]);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!validators.email.regex.test(formData.email.trim())) {
      errors.email = validators.email.message;
    }
    const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, "");
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!validators.phone.regex.test(cleanPhone)) {
      errors.phoneNumber = validators.phone.message;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmitStaff = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      let positionValue = formData.position;
      if (formData.position === "Front Desk" || formData.position.toLowerCase() === "frontdesk") {
        positionValue = "frontdesk";
      }
      const payload = {
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        hotelId,
        position: positionValue,
        dateJoined: formData.dateJoined,
        roles: ["STAFF"],
      };
      if (editingStaff) {
        const { data: updatedStaff } = await api.put(`/staff/${editingStaff.staffId}`, payload);
        setStaff((prev) => prev.map((member) => (member.staffId === editingStaff.staffId ? updatedStaff : member)));
        handleCloseDialog();
        toast.success("Staff member updated successfully!", { duration: 6000 });
      } else {
        const { data: newStaff } = await api.post("/staff", payload);
        setStaff((prev) => [...prev, newStaff]);
        handleCloseDialog();
        toast.success("Staff member added successfully!", { duration: 6000 });
      }
    } catch (error) {
      let errorMessage = editingStaff ? "Failed to update staff member" : "Failed to add staff member";
      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        if (backendMessage.includes("Staff") && backendMessage.includes("email")) {
          errorMessage = "A staff member with this email address already exists. Please use a different email.";
        } else if (backendMessage.includes("already exists") || backendMessage.includes("conflict")) {
          errorMessage = "This staff member information conflicts with existing data. Please check the details and try again.";
        } else if (backendMessage.includes("Invalid") || backendMessage.includes("validation")) {
          errorMessage = "Invalid data provided. Please check the email and phone number format.";
        } else {
          errorMessage = backendMessage;
        }
      } else if (error.response?.data?.error) {
        const responseData = error.response.data;
        if (responseData.error === "Internal Server Error" && responseData.status === 500) {
          errorMessage = "The server encountered an unexpected error while saving the staff member. Please try again in a few moments.";
        } else {
          errorMessage = `Server error: ${responseData.error}`;
        }
      } else if (error.response?.status === 500) {
        errorMessage = "The server encountered an unexpected error. Please try again in a few moments.";
      } else if (error.response?.status === 409) {
        errorMessage = "A staff member with this email address already exists. Please use a different email.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid data provided. Please check the email and phone number format.";
      } else if (error.response?.status === 422) {
        errorMessage = "The provided data is invalid or incomplete. Please verify all fields.";
      } else if (error.response?.status === 503) {
        errorMessage = "The service is temporarily unavailable. Please try again later.";
      } else if (error.response?.status >= 500) {
        errorMessage = "A server error occurred. Please try again later.";
      }
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staffMember) => {
    try {
      setDeletingId(staffMember.id);
      await api.delete(`/staff/${staffMember.staffId}`);
      setStaff((prev) => prev.filter((member) => member.staffId !== staffMember.staffId));
      toast.success("Staff member removed successfully!", { duration: 6000 });
    } catch (error) {
      let errorMessage = "Failed to delete staff member";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        const responseData = error.response.data;
        if (responseData.error === "Internal Server Error" && responseData.status === 500) {
          errorMessage = "The server encountered an unexpected error while deleting the staff member. Please try again in a few moments.";
        } else {
          errorMessage = `Server error: ${responseData.error}`;
        }
      } else if (error.response?.status === 500) {
        errorMessage = "The server encountered an unexpected error. Please try again in a few moments.";
      }
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setDeletingId(null);
    }
  };

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [formErrors]
  );

  const handleCloseDialog = useCallback(() => {
    setFormData({ email: "", phoneNumber: "", position: "Front Desk", dateJoined: new Date().toISOString().split('T')[0] });
    setFormErrors({});
    setEditingStaff(null);
    setShowAddDialog(false);
  }, []);

  const handleEditStaff = useCallback((member) => {
    setEditingStaff(member);
    setFormData({
      email: member.staffEmail || "",
      phoneNumber: member.number || "",
      position: member.position || "Front Desk",
      dateJoined: member.dateJoined || new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
    setShowAddDialog(true);
  }, []);

  if (loading) {
    return (
      <div>
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
          <Users className="h-[14px] w-[14px] text-neutral-500" />
          <h3 className="text-[13px] font-semibold text-neutral-950">Staff Members</h3>
        </div>
        <div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-100 last:border-0">
              <div className="h-8 w-8 rounded-full bg-neutral-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-neutral-100 animate-pulse rounded w-32" />
                <div className="h-3 bg-neutral-100 animate-pulse rounded w-52" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !staff.length) {
    return (
      <div>
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
          <Users className="h-[14px] w-[14px] text-neutral-500" />
          <h3 className="text-[13px] font-semibold text-neutral-950">Staff Members</h3>
        </div>
        <div className="mx-5 my-4 flex items-start gap-3 rounded-lg border border-neutral-200 border-l-2 border-l-red-500 bg-white px-4 py-3">
          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-neutral-950">Failed to load staff</p>
            <p className="text-[12px] text-neutral-500 mt-0.5 leading-snug">{error}</p>
            <button
              onClick={fetchStaff}
              className="mt-2 text-[12px] font-medium text-neutral-950 underline underline-offset-2 hover:no-underline transition-all"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-[14px] w-[14px] text-neutral-500" />
          <h3 className="text-[13px] font-semibold text-neutral-950">Staff Members</h3>
          <span className="ml-1 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
            {staff.length}{isLimitedPlan ? ` / ${STAFF_LIMIT}` : ""}
          </span>
        </div>
        <button
          onClick={() => isLimitedPlan && staff.length >= STAFF_LIMIT ? setUpgradeDialogOpen(true) : setShowAddDialog(true)}
          className="flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-neutral-950 text-white text-[12px] font-medium hover:opacity-85 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Staff Member
        </button>
      </div>

      <ProUpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />

      {/* Staff List */}
      {staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
            <Users className="h-5 w-5 text-neutral-400" />
          </div>
          <p className="text-[13px] font-medium text-neutral-950">No staff members yet</p>
          <p className="text-[12px] text-neutral-500 mt-1">Add your first team member to get started.</p>
        </div>
      ) : (
        <div>
          {staff.map((member) => (
            <div
              key={member.staffId || member.id}
              className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-100 last:border-0"
            >
              {/* Avatar */}
              <div className="h-8 w-8 rounded-full bg-neutral-950 text-white text-[11px] font-semibold flex items-center justify-center flex-shrink-0 overflow-hidden">
                {member.profilePictureUrl ? (
                  <img src={member.profilePictureUrl} alt={member.fullName || 'Staff'} className="h-8 w-8 object-cover" />
                ) : (
                  getInitials(member.fullName || member.staffEmail)
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-medium text-neutral-950 truncate">
                    {member.fullName || member.staffEmail || "Staff Member"}
                  </span>
                  {member.position && (
                    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                      {member.position}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-neutral-400 flex-shrink-0" />
                    <span className="text-[12px] text-neutral-400 truncate">{member.staffEmail || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-neutral-400 flex-shrink-0" />
                    <span className="text-[12px] text-neutral-400">{member.number || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="h-7 w-7 rounded-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950 transition-colors disabled:opacity-40"
                    disabled={deletingId === member.id}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    className="text-[13px]"
                    onClick={() => handleEditStaff(member)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 text-[13px]"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-sm border border-neutral-200 shadow-none rounded-lg p-0 gap-0">
                      <AlertDialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
                        <AlertDialogTitle className="text-[15px] font-semibold text-neutral-950 tracking-tight">
                          Remove staff member?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[12px] text-neutral-400 mt-0.5">
                          <span className="font-medium text-neutral-700">
                            {member.fullName || member.staffEmail || member.email}
                          </span>{" "}
                          will be removed from your team. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="px-6 py-4 flex items-center justify-end gap-2 flex-row">
                        <AlertDialogCancel className="h-9 px-5 rounded-md border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 shadow-none mt-0">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteStaff(member)}
                          className="h-9 px-5 rounded-md bg-red-600 text-white text-[13px] font-medium hover:bg-red-700 shadow-none"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => (open ? setShowAddDialog(true) : handleCloseDialog())}>
        <DialogContent className="max-w-sm border border-neutral-200 shadow-none rounded-lg p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1 block">
              {editingStaff ? "Edit Member" : "New Member"}
            </span>
            <DialogTitle className="text-[15px] font-semibold text-neutral-950 tracking-tight">
              {editingStaff ? "Edit Staff Member" : "Add Staff Member"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="staff@hotel.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={submitting || !!editingStaff}
                autoComplete="email"
                className={`h-9 w-full rounded-md border px-3 text-[13px] text-neutral-950 bg-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors disabled:opacity-60 ${
                  formErrors.email ? "border-red-400 bg-red-50 focus:border-red-400" : "border-neutral-200"
                }`}
              />
              {editingStaff && (
                <p className="text-[11px] text-neutral-400 mt-1">Email cannot be changed.</p>
              )}
              {formErrors.email && (
                <p className="flex items-center gap-1 text-[11px] text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+975 17 123 456"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                disabled={submitting}
                autoComplete="tel"
                className={`h-9 w-full rounded-md border px-3 text-[13px] text-neutral-950 bg-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors disabled:opacity-60 ${
                  formErrors.phoneNumber ? "border-red-400 bg-red-50 focus:border-red-400" : "border-neutral-200"
                }`}
              />
              {formErrors.phoneNumber && (
                <p className="flex items-center gap-1 text-[11px] text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {formErrors.phoneNumber}
                </p>
              )}
            </div>

            {/* Position */}
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">
                Position
              </label>
              <select
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                disabled={submitting}
                className="h-9 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 text-[13px] text-neutral-950 focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors disabled:opacity-60"
              >
                {staffPositions.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            {/* Date Joined */}
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">
                Date Joined
              </label>
              <input
                type="date"
                value={formData.dateJoined}
                onChange={(e) => handleInputChange("dateJoined", e.target.value)}
                disabled={submitting}
                className="h-9 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 text-[13px] text-neutral-950 focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          <div className="px-6 pb-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCloseDialog}
              disabled={submitting}
              className="h-9 px-5 rounded-md border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitStaff}
              disabled={submitting}
              className="flex items-center gap-1.5 h-9 px-5 rounded-md bg-neutral-950 text-white text-[13px] font-medium hover:opacity-85 transition-opacity disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {editingStaff ? "Saving…" : "Adding…"}
                </>
              ) : editingStaff ? (
                "Save Changes"
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add Staff
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManager;
