import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Settings,
  FileText,
  MoreVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/select";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/dropdown-menu";
import { Checkbox } from "@/shared/components/checkbox";
import { toast } from "sonner";
import { useAuth } from "../authentication";
import api from "../../shared/services/Api";
import { LeaveManagementTabs } from "@/components/ui/leave-management-tabs";
import * as XLSX from "xlsx";

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_ICONS = {
  PENDING: AlertCircle,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
};

const StatusChip = ({ status }) => {
  const Icon = STATUS_ICONS[status] || AlertCircle;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        STATUS_STYLES[status] || "bg-neutral-50 text-neutral-600 border-neutral-200"
      }`}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
};

const TH = ({ children, right }) => (
  <th
    className={`h-9 text-[11px] font-semibold tracking-widest uppercase text-neutral-400 bg-neutral-50 px-4 whitespace-nowrap border-b border-neutral-100 ${
      right ? "text-right" : "text-left"
    }`}
  >
    {children}
  </th>
);

const TD = ({ children, right, className = "" }) => (
  <td
    className={`px-4 py-3 text-[13px] text-neutral-700 border-b border-neutral-100 ${
      right ? "text-right" : ""
    } ${className}`}
  >
    {children}
  </td>
);

const LeaveManagement = ({ hotelId }) => {
  const { userId, roles } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [enhancedLeaves, setEnhancedLeaves] = useState([]);
  const [staff, setStaff] = useState([]);
  const [leavePolicies, setLeavePolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [enhancedFilterStatus, setEnhancedFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("policies");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectingLeaveId, setRejectingLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [allStaff, setAllStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffLeaves, setStaffLeaves] = useState([]);
  const [staffLeavesLoading, setStaffLeavesLoading] = useState(false);
  const leaveHistoryRef = useRef(null);

  const isStaff = roles?.includes("STAFF");
  const isFrontdesk = roles?.includes("FRONTDESK");
  const isStaffOrFrontdesk = isStaff || isFrontdesk;
  const isHotelAdmin = roles?.includes("HOTEL_ADMIN");
  const canManagePolicies = !roles?.includes("STAFF") && !roles?.includes("FRONTDESK");
  const canViewPolicies = true;
  const canRequestLeave = !roles?.includes("HOTEL_OWNER") && !roles?.includes("HOTEL_ADMIN");
  const canViewBasicLeaves = !isHotelAdmin;
  const canEditStatus = !isStaffOrFrontdesk;

  const [leaveForm, setLeaveForm] = useState({
    staffId: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    status: "PENDING",
  });

  const [policyForm, setPolicyForm] = useState({
    leaveTypeEnum: "",
    isPaid: true,
    maxDaysPerYear: "",
    carryForward: false,
    requiresApproval: true,
    active: true,
    description: "",
  });

  const leaveTypeEnums = [
    "SICK_LEAVE",
    "ANNUAL_LEAVE",
    "PERSONAL_LEAVE",
    "MATERNITY_LEAVE",
    "PATERNITY_LEAVE",
    "EMERGENCY_LEAVE",
    "COMPENSATORY_LEAVE",
    "STUDY_LEAVE",
    "BEREAVEMENT_LEAVE",
    "MEDICAL_LEAVE",
  ];

  useEffect(() => {
    fetchLeaves();
    fetchStaff();
    fetchLeavePolicies();
    if (!isStaffOrFrontdesk) {
      fetchAllStaff();
    }
  }, [hotelId]);

  useEffect(() => {
    if (isHotelAdmin && enhancedLeaves.length > 0) {
      setActiveTab("enhanced");
    }
  }, [isHotelAdmin, enhancedLeaves.length]);

  useEffect(() => {
    const isManager = roles?.includes("MANAGER");
    if (isManager) {
      if (enhancedLeaves.length > 0) {
        setActiveTab("enhanced");
      } else {
        setActiveTab("staff");
      }
    }
  }, [roles, enhancedLeaves.length]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      if (isStaffOrFrontdesk) {
        const response = await api.get(`/leaves/user/${userId}`);
        setLeaves(response.data);
      } else if (roles?.includes("MANAGER")) {
        const response = await api.get(`/leaves/hotel/${hotelId}`);
        const data = response.data || [];
        setLeaves(data);
        if (data.length > 0 && data[0].employeeName) {
          setEnhancedLeaves(data);
        } else {
          setEnhancedLeaves([]);
        }
      } else {
        const response = await api.get(`/leaves/hotel/${hotelId}`);
        const data = response.data || [];
        setLeaves(data);
        if (data.length > 0 && data[0].employeeName) {
          setEnhancedLeaves(data);
        } else {
          setEnhancedLeaves([]);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch leave requests");
      setEnhancedLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await api.get(`/hotels/${hotelId}/staff`);
      setStaff(response.data);
    } catch (error) {
      // silent
    }
  };

  const fetchLeavePolicies = async () => {
    try {
      const response = await api.get(`/leave-types`);
      setLeavePolicies(response.data);
    } catch (error) {
      toast.error("Failed to fetch leave policies");
    }
  };

  const fetchAllStaff = async () => {
    try {
      const response = await api.get(`/staff/hotel/${hotelId}`);
      setAllStaff(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        try {
          const altResponse = await api.get(`/hotels/${hotelId}/staff`);
          setAllStaff(altResponse.data);
          return;
        } catch (altError) {
          // silent
        }
      }
      toast.error(`Failed to fetch staff list: ${error.response?.data?.message || error.message}`);
    }
  };

  const fetchStaffLeaves = async (staffUserId) => {
    try {
      setStaffLeavesLoading(true);
      const response = await api.get(`/leaves/user/${staffUserId}`);
      setStaffLeaves(response.data);
      setTimeout(() => {
        if (leaveHistoryRef.current) {
          leaveHistoryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } catch (error) {
      toast.error(`Failed to fetch staff leave history: ${error.response?.data?.message || error.message}`);
      setStaffLeaves([]);
    } finally {
      setStaffLeavesLoading(false);
    }
  };

  const handleStaffSelect = (staffMember) => {
    setSelectedStaff(staffMember);
    fetchStaffLeaves(staffMember.userId || staffMember.staffId || staffMember.id);
  };

  const handleExportLeaves = async () => {
    try {
      const loadingToast = toast.loading("Preparing Excel export...");
      const response = await api.get(`/leaves/hotel/${hotelId}`);
      const leavesData = response.data || [];
      if (leavesData.length === 0) {
        toast.dismiss(loadingToast);
        toast.warning("No leave data to export");
        return;
      }
      const excelData = leavesData.map((leave) => ({
        "Employee Name": leave.employeeName || "N/A",
        "Employee Email": leave.employeeEmail || "N/A",
        "Position": leave.employeePosition || "N/A",
        "Leave Type": leave.leaveType?.name || formatLeaveTypeEnum(leave.leaveType?.leaveTypeEnum) || "N/A",
        "Start Date": leave.startDate ? new Date(leave.startDate).toLocaleDateString() : "N/A",
        "End Date": leave.endDate ? new Date(leave.endDate).toLocaleDateString() : "N/A",
        "Total Days": leave.totalDays || calculateDays(leave.startDate, leave.endDate) || "N/A",
        "Status": leave.status || "N/A",
        "Reason": leave.reason || "N/A",
        "Rejection Reason": leave.rejectionReason || "N/A",
        "Approved By": leave.approvedBy || "N/A",
        "Created At": leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : "N/A",
      }));
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      worksheet["!cols"] = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
        { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 30 }, { wch: 30 },
        { wch: 20 }, { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Requests");
      const fileName = `Hotel_Leaves_${hotelId}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.dismiss(loadingToast);
      toast.success(`Exported ${leavesData.length} leave requests to Excel`, { duration: 6000 });
    } catch (error) {
      toast.error("Failed to export leave data to Excel");
    }
  };

  const toggleLeaveSummary = async () => {
    if (showSummary) {
      setShowSummary(false);
    } else {
      if (!leaveSummary) {
        try {
          setSummaryLoading(true);
          const response = await api.get(`/leaves/summary/user/${userId}`);
          setLeaveSummary(response.data);
        } catch (error) {
          toast.error("Failed to fetch leave summary");
          return;
        } finally {
          setSummaryLoading(false);
        }
      }
      setShowSummary(true);
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.leaveType) {
      toast.error("Please select a leave type");
      return;
    }
    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    if (new Date(leaveForm.startDate) > new Date(leaveForm.endDate)) {
      toast.error("End date must be after start date");
      return;
    }
    try {
      const totalDays = calculateDays(leaveForm.startDate, leaveForm.endDate);
      const leaveData = {
        userId: parseInt(userId, 10),
        leaveTypeId: parseInt(leaveForm.leaveType, 10),
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        totalDays,
        reason: leaveForm.reason,
      };
      if (editingLeave) {
        await api.put(`/leaves/${editingLeave.id}`, leaveData);
        toast.success("Leave request updated successfully");
      } else {
        await api.post("/leaves", leaveData);
        toast.success("Leave request submitted successfully");
      }
      setShowLeaveForm(false);
      setEditingLeave(null);
      setLeaveForm({ staffId: "", leaveType: "", startDate: "", endDate: "", reason: "", status: "PENDING" });
      fetchLeaves();
    } catch (error) {
      toast.error(`Failed to submit leave request: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateStatus = async (leaveId, status, reason = null) => {
    try {
      const requestBody = { status };
      if (reason) requestBody.rejectionReason = reason;
      await api.patch(`/leaves/${leaveId}/status`, requestBody);
      toast.success(`Leave request ${status.toLowerCase()}`);
      fetchLeaves();
    } catch (error) {
      toast.error("Failed to update leave status");
    }
  };

  const handleRejectLeave = (leaveId) => {
    setRejectingLeaveId(leaveId);
    setRejectionReason("");
    setShowRejectionDialog(true);
  };

  const handleConfirmRejection = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    await handleUpdateStatus(rejectingLeaveId, "REJECTED", rejectionReason.trim());
    setShowRejectionDialog(false);
    setRejectingLeaveId(null);
    setRejectionReason("");
  };

  const handleDeleteLeave = async (leaveId) => {
    try {
      await api.delete(`/leaves/${leaveId}`);
      toast.success("Leave request deleted");
      fetchLeaves();
    } catch (error) {
      toast.error("Failed to delete leave request");
    }
  };

  const handleEditLeave = (leave) => {
    setEditingLeave(leave);
    setLeaveForm({
      staffId: "",
      leaveType: leave.leaveTypeId?.toString() || leave.leaveType?.toString() || "",
      startDate: leave.startDate.split("T")[0],
      endDate: leave.endDate.split("T")[0],
      reason: leave.reason,
      status: leave.status,
    });
    setShowLeaveForm(true);
  };

  const handleSubmitPolicy = async (e) => {
    e.preventDefault();
    if (!policyForm.leaveTypeEnum) {
      toast.error("Please select a leave type");
      return;
    }
    if (!policyForm.maxDaysPerYear || policyForm.maxDaysPerYear === "") {
      toast.error("Please enter maximum days per year");
      return;
    }
    const maxDays = parseInt(policyForm.maxDaysPerYear, 10);
    if (isNaN(maxDays) || maxDays <= 0) {
      toast.error("Please enter a valid number for maximum days per year");
      return;
    }
    try {
      const policyData = { ...policyForm, maxDaysPerYear: maxDays };
      if (editingPolicy) {
        await api.put(`/leave-types/${editingPolicy.id}`, policyData);
        toast.success("Leave policy updated successfully");
      } else {
        await api.post("/leave-types", policyData);
        toast.success("Leave policy created successfully");
      }
      setShowPolicyForm(false);
      setEditingPolicy(null);
      setPolicyForm({ leaveTypeEnum: "", isPaid: true, maxDaysPerYear: "", carryForward: false, requiresApproval: true, active: true, description: "" });
      fetchLeavePolicies();
    } catch (error) {
      toast.error(`Failed to submit leave policy: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeletePolicy = async (policyId) => {
    try {
      await api.delete(`/leave-types/${policyId}`);
      toast.success("Leave policy deleted");
      fetchLeavePolicies();
    } catch (error) {
      toast.error("Failed to delete leave policy");
    }
  };

  const handleLoadDefaults = async () => {
    setLoadingDefaults(true);
    const existing = new Set(leavePolicies.map((p) => p.leaveTypeEnum));
    const toCreate = DEFAULT_LEAVE_POLICIES.filter((p) => !existing.has(p.leaveTypeEnum));
    if (toCreate.length === 0) {
      toast.info("All default policies are already configured");
      setLoadingDefaults(false);
      return;
    }
    try {
      await Promise.all(toCreate.map((policy) => api.post("/leave-types", policy)));
      await fetchLeavePolicies();
      toast.success(`${toCreate.length} default leave policies added`);
    } catch (error) {
      toast.error("Failed to load some default policies");
    } finally {
      setLoadingDefaults(false);
    }
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setPolicyForm({
      leaveTypeEnum: policy.leaveTypeEnum,
      isPaid: policy.isPaid,
      maxDaysPerYear: policy.maxDaysPerYear.toString(),
      carryForward: policy.carryForward,
      requiresApproval: policy.requiresApproval,
      active: policy.active,
      description: policy.description || "",
    });
    setShowPolicyForm(true);
  };

  const filteredLeaves = leaves.filter((leave) =>
    filterStatus === "all" || leave.status === filterStatus
  );

  const filteredEnhancedLeaves = enhancedLeaves.filter((leave) =>
    enhancedFilterStatus === "all" || leave.status === enhancedFilterStatus
  );

  const getStaffName = (staffId) => {
    const staffMember = staff.find((s) => s.id === staffId || s.id === parseInt(staffId, 10));
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : "Unknown Staff";
  };

  const getLeaveTypeName = (leaveTypeId) => {
    const policy = leavePolicies.find((p) => p.id === leaveTypeId || p.id === parseInt(leaveTypeId, 10));
    return policy ? formatLeaveTypeEnum(policy.leaveTypeEnum) : "Unknown Type";
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatLeaveTypeEnum = (enumValue) => {
    const enumMap = {
      SICK_LEAVE: "Sick Leave",
      ANNUAL_LEAVE: "Annual Leave",
      PERSONAL_LEAVE: "Personal Leave",
      MATERNITY_LEAVE: "Maternity Leave",
      PATERNITY_LEAVE: "Paternity Leave",
      EMERGENCY_LEAVE: "Emergency Leave",
      COMPENSATORY_LEAVE: "Compensatory Leave",
      STUDY_LEAVE: "Study Leave",
      BEREAVEMENT_LEAVE: "Bereavement Leave",
      MEDICAL_LEAVE: "Medical Leave",
    };
    return enumMap[enumValue] || enumValue;
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 gap-2.5 text-neutral-500">
        <span className="animate-spin rounded-full h-5 w-5 border-2 border-neutral-200 border-t-neutral-950" />
        <span className="text-[13px]">Loading leave requests…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header action buttons */}
      {(canRequestLeave || canManagePolicies) && (
        <div className="flex items-center gap-2">
          {canRequestLeave && (
            <button
              onClick={() => setShowLeaveForm(true)}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-md border border-neutral-200 bg-white text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Request Leave
            </button>
          )}
          {canManagePolicies && (
            <button
              onClick={() => setShowPolicyForm(true)}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-md border border-neutral-200 bg-white text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Add Policy
            </button>
          )}
        </div>
      )}

      {/* Tab navigation */}
      <LeaveManagementTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        canViewBasicLeaves={canViewBasicLeaves}
        canViewPolicies={canViewPolicies}
        isStaffOrFrontdesk={isStaffOrFrontdesk}
        enhancedLeaves={enhancedLeaves}
        roles={roles}
      />

      {/* My Leave Requests tab */}
      {canViewBasicLeaves && !roles?.includes("MANAGER") && activeTab === "requests" && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <TH>Leave Type</TH>
                  <TH>Start Date</TH>
                  <TH>End Date</TH>
                  <TH>Days</TH>
                  <TH>Status</TH>
                  <TH>Reason</TH>
                  <TH>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center border-b border-neutral-100">
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                          <Calendar className="h-5 w-5 text-neutral-400" />
                        </div>
                        <p className="text-[13px] font-medium text-neutral-950">No leave requests found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-neutral-50/50">
                      <TD className="font-medium text-neutral-950">
                        {getLeaveTypeName(leave.leaveTypeId || leave.leaveType)}
                      </TD>
                      <TD>{new Date(leave.startDate).toLocaleDateString()}</TD>
                      <TD>{new Date(leave.endDate).toLocaleDateString()}</TD>
                      <TD>
                        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                          {calculateDays(leave.startDate, leave.endDate)} days
                        </span>
                      </TD>
                      <TD><StatusChip status={leave.status} /></TD>
                      <TD>
                        <span className="truncate max-w-[200px] block" title={leave.reason}>
                          {leave.reason}
                        </span>
                      </TD>
                      <TD>
                        <div className="flex items-center gap-1">
                          {!isStaffOrFrontdesk && leave.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(leave.id, "APPROVED")}
                                className="h-7 px-3 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-[12px] font-medium hover:bg-emerald-100 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(leave.id, "REJECTED")}
                                className="h-7 px-3 rounded-md border border-red-200 bg-red-50 text-red-600 text-[12px] font-medium hover:bg-red-100 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {isStaffOrFrontdesk && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="h-7 w-7 rounded-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition-colors">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleEditLeave(leave)}
                                  disabled={leave.status !== "PENDING"}
                                  className={leave.status !== "PENDING" ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                  <Edit className="h-3.5 w-3.5 mr-2" />
                                  Edit Request
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteConfirmId(leave.id)}
                                  disabled={leave.status !== "PENDING"}
                                  className={`text-red-600 focus:text-red-600 ${leave.status !== "PENDING" ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Delete Request
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TD>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Leave Requests tab */}
      {!isStaffOrFrontdesk && enhancedLeaves.length > 0 && activeTab === "enhanced" && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-neutral-950">Employee Leave Requests</h3>
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                {filteredEnhancedLeaves.length}
              </span>
            </div>
            <button
              onClick={handleExportLeaves}
              className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-neutral-200 bg-white text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <TH>Employee</TH>
                  <TH>Position</TH>
                  <TH>Leave Type</TH>
                  <TH>Start Date</TH>
                  <TH>End Date</TH>
                  <TH>Days</TH>
                  <TH>Status</TH>
                  <TH>Reason</TH>
                  <TH>Contact</TH>
                  <TH>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {filteredEnhancedLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center border-b border-neutral-100">
                      <p className="text-[13px] text-neutral-500">No leave requests found</p>
                    </td>
                  </tr>
                ) : (
                  filteredEnhancedLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-neutral-50/50">
                      <TD>
                        <div>
                          <p className="font-semibold text-neutral-950 text-[13px]">{leave.employeeName}</p>
                          <p className="text-[11px] text-neutral-400">{leave.employeeEmail}</p>
                        </div>
                      </TD>
                      <TD>
                        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                          {leave.employeePosition}
                        </span>
                      </TD>
                      <TD>{leave.leaveType.name || formatLeaveTypeEnum(leave.leaveType.leaveTypeEnum)}</TD>
                      <TD>{new Date(leave.startDate).toLocaleDateString()}</TD>
                      <TD>{new Date(leave.endDate).toLocaleDateString()}</TD>
                      <TD>
                        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                          {leave.totalDays} days
                        </span>
                      </TD>
                      <TD>
                        <div className="space-y-1">
                          <StatusChip status={leave.status} />
                          {leave.status === "REJECTED" && leave.rejectionReason && (
                            <p className="text-[11px] text-red-600 bg-red-50 rounded px-2 py-1 leading-snug">
                              {leave.rejectionReason}
                            </p>
                          )}
                          {leave.status === "APPROVED" && leave.approvedBy && (
                            <p className="text-[11px] text-emerald-600 bg-emerald-50 rounded px-2 py-1 leading-snug">
                              By: {leave.approvedBy}
                            </p>
                          )}
                        </div>
                      </TD>
                      <TD>
                        <span className="truncate max-w-[160px] block" title={leave.reason}>
                          {leave.reason}
                        </span>
                      </TD>
                      <TD>
                        <div>
                          <p className="text-[13px] text-neutral-700">
                            {leave.contactNumber || leave.employeePhoneNumber || "—"}
                          </p>
                          {leave.emergencyContact && (
                            <p className="text-[11px] text-neutral-400">
                              Emergency: {leave.emergencyContact}
                            </p>
                          )}
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center gap-1">
                          {leave.isEmergency && (
                            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                              Emergency
                            </span>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="h-7 w-7 rounded-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition-colors">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel className="text-[11px] text-neutral-400 uppercase tracking-widest">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {leave.status === "PENDING" ? (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(leave.id, "APPROVED")}
                                    className="text-emerald-600 focus:text-emerald-600 text-[13px]"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRejectLeave(leave.id)}
                                    className="text-red-600 focus:text-red-600 text-[13px]"
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem disabled className="text-[13px]">
                                  <span className="text-neutral-400">
                                    {leave.status === "APPROVED" ? "Already Approved" : "Already Rejected"}
                                  </span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TD>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Leave Overview tab */}
      {!isStaffOrFrontdesk && activeTab === "staff" && (
        <div className="space-y-4">
          {/* Staff card grid */}
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100">
              <h3 className="text-[13px] font-semibold text-neutral-950">Employee Leave Overview</h3>
            </div>
            <div className="p-5">
              {allStaff.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                    <User className="h-5 w-5 text-neutral-400" />
                  </div>
                  <p className="text-[13px] font-medium text-neutral-950">No staff members found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allStaff.map((staffMember) => {
                    const isSelected =
                      selectedStaff?.staffId === staffMember.staffId ||
                      selectedStaff?.id === staffMember.id;
                    const initials = (
                      staffMember.fullName ||
                      `${staffMember.firstName || ""} ${staffMember.lastName || ""}`.trim()
                    )
                      .split(" ")
                      .map((w) => w.charAt(0))
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    return (
                      <button
                        key={staffMember.staffId || staffMember.id}
                        onClick={() => handleStaffSelect(staffMember)}
                        className={`text-left p-4 rounded-lg border transition-colors ${
                          isSelected
                            ? "border-neutral-950 bg-neutral-50"
                            : "border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-neutral-950 text-white text-[12px] font-semibold flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {staffMember.profilePictureUrl ? (
                              <img
                                src={staffMember.profilePictureUrl}
                                alt={staffMember.fullName}
                                className="h-9 w-9 object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-neutral-950 truncate">
                              {staffMember.fullName ||
                                `${staffMember.firstName || ""} ${staffMember.lastName || ""}`.trim()}
                            </p>
                            <p className="text-[11px] text-neutral-400 truncate">
                              {staffMember.position || "Staff Member"}
                            </p>
                          </div>
                        </div>
                        {staffMember.number && (
                          <p className="text-[11px] text-neutral-400 mt-2 truncate">{staffMember.number}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Selected staff leave history */}
          {selectedStaff && (
            <div
              ref={leaveHistoryRef}
              className="bg-white border border-neutral-200 rounded-lg overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-neutral-950">
                  Leave History —{" "}
                  {selectedStaff.fullName ||
                    `${selectedStaff.firstName || ""} ${selectedStaff.lastName || ""}`.trim()}
                </h3>
                <button
                  onClick={() => {
                    setSelectedStaff(null);
                    setStaffLeaves([]);
                  }}
                  className="h-7 px-3 rounded-md border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Close
                </button>
              </div>

              {staffLeavesLoading ? (
                <div className="flex items-center justify-center py-10 gap-2.5 text-neutral-500">
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-neutral-200 border-t-neutral-950" />
                  <span className="text-[13px]">Loading leave history…</span>
                </div>
              ) : staffLeaves.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-[13px] text-neutral-500">
                    No leave requests found for this staff member
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <TH>Leave Type</TH>
                        <TH right>Total Allowed</TH>
                        <TH right>Used</TH>
                        <TH right>Remaining</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const leaveTypeData = Object.entries(
                          staffLeaves.reduce((acc, leave) => {
                            const leaveTypeName =
                              leave.leaveTypeName ||
                              getLeaveTypeName(leave.leaveTypeId || leave.leaveType);
                            if (!acc[leaveTypeName]) {
                              acc[leaveTypeName] = { totalAllowed: 0, used: 0, leaveTypeCode: leave.leaveTypeCode };
                            }
                            return acc;
                          }, {})
                        );

                        let totalAllowedSum = 0;
                        let totalUsedSum = 0;
                        let totalRemainingSum = 0;

                        const leaveRows = leaveTypeData.map(([leaveTypeName, data]) => {
                          const leavePolicy = leavePolicies.find(
                            (p) =>
                              p.leaveTypeEnum === data.leaveTypeCode ||
                              formatLeaveTypeEnum(p.leaveTypeEnum) === leaveTypeName
                          );
                          const totalAllowed = leavePolicy?.maxDaysPerYear || 12;
                          const used = staffLeaves
                            .filter(
                              (l) =>
                                (l.leaveTypeName || getLeaveTypeName(l.leaveTypeId || l.leaveType)) ===
                                  leaveTypeName && l.status === "APPROVED"
                            )
                            .reduce(
                              (sum, l) => sum + (l.totalDays || calculateDays(l.startDate, l.endDate)),
                              0
                            );
                          const remaining = Math.max(0, totalAllowed - used);
                          totalAllowedSum += totalAllowed;
                          totalUsedSum += used;
                          totalRemainingSum += remaining;
                          return (
                            <tr key={leaveTypeName} className="hover:bg-neutral-50/50">
                              <td className="px-4 py-3 text-[13px] text-neutral-700 border-b border-neutral-100">
                                {leaveTypeName}
                              </td>
                              <td className="px-4 py-3 text-[13px] text-neutral-700 border-b border-neutral-100 text-right tabular-nums">
                                {totalAllowed}
                              </td>
                              <td className="px-4 py-3 text-[13px] text-neutral-700 border-b border-neutral-100 text-right tabular-nums">
                                {used}
                              </td>
                              <td className="px-4 py-3 border-b border-neutral-100 text-right">
                                <span
                                  className={`text-[13px] font-medium tabular-nums ${
                                    remaining > 0 ? "text-emerald-600" : "text-red-600"
                                  }`}
                                >
                                  {remaining}
                                </span>
                              </td>
                            </tr>
                          );
                        });

                        const totalRow = (
                          <tr key="total" className="bg-neutral-50">
                            <td className="px-4 py-3 text-[13px] font-semibold text-neutral-950">
                              Total Leaves
                            </td>
                            <td className="px-4 py-3 text-[13px] font-semibold text-neutral-950 text-right tabular-nums">
                              {totalAllowedSum}
                            </td>
                            <td className="px-4 py-3 text-[13px] font-semibold text-neutral-950 text-right tabular-nums">
                              {totalUsedSum}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`text-[13px] font-semibold tabular-nums ${
                                  totalRemainingSum > 0 ? "text-emerald-600" : "text-red-600"
                                }`}
                              >
                                {totalRemainingSum}
                              </span>
                            </td>
                          </tr>
                        );

                        return [...leaveRows, totalRow];
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hotel Leave Policies tab */}
      {canViewPolicies && activeTab === "policies" && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <TH>Leave Type</TH>
                  <TH>Max Days/Year</TH>
                  <TH>Paid</TH>
                  <TH>Carry Forward</TH>
                  <TH>Requires Approval</TH>
                  <TH>Status</TH>
                  <TH>Description</TH>
                  {canManagePolicies && <TH>Actions</TH>}
                </tr>
              </thead>
              <tbody>
                {leavePolicies.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canManagePolicies ? 8 : 7}
                      className="px-5 py-12 text-center border-b border-neutral-100"
                    >
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                          <FileText className="h-5 w-5 text-neutral-400" />
                        </div>
                        <p className="text-[13px] font-medium text-neutral-950 mb-3">
                          No leave policies configured
                        </p>
                        {canManagePolicies && (
                          <button
                            onClick={() => setShowPolicyForm(true)}
                            className="flex items-center gap-1.5 h-8 px-3.5 rounded-md border border-neutral-200 bg-white text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add First Policy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  leavePolicies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-neutral-50/50">
                      <TD>
                        <div className="flex items-center gap-2 font-medium text-neutral-950">
                          <FileText className="h-3.5 w-3.5 text-neutral-400" />
                          {formatLeaveTypeEnum(policy.leaveTypeEnum)}
                        </div>
                      </TD>
                      <TD>
                        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                          {policy.maxDaysPerYear} days
                        </span>
                      </TD>
                      <TD>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                            policy.isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-neutral-50 text-neutral-500 border-neutral-200"
                          }`}
                        >
                          {policy.isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </TD>
                      <TD>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                            policy.carryForward
                              ? "bg-neutral-950 text-white border-neutral-950"
                              : "bg-neutral-50 text-neutral-500 border-neutral-200"
                          }`}
                        >
                          {policy.carryForward ? "Yes" : "No"}
                        </span>
                      </TD>
                      <TD>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                            policy.requiresApproval
                              ? "bg-neutral-950 text-white border-neutral-950"
                              : "bg-neutral-50 text-neutral-500 border-neutral-200"
                          }`}
                        >
                          {policy.requiresApproval ? "Yes" : "No"}
                        </span>
                      </TD>
                      <TD>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                            policy.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-neutral-50 text-neutral-500 border-neutral-200"
                          }`}
                        >
                          {policy.active ? "Active" : "Inactive"}
                        </span>
                      </TD>
                      <TD>
                        <span
                          className="truncate max-w-[160px] block"
                          title={policy.description || ""}
                        >
                          {policy.description || "—"}
                        </span>
                      </TD>
                      {canManagePolicies && (
                        <TD>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditPolicy(policy)}
                              className="h-7 w-7 rounded-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="h-7 w-7 rounded-md border border-red-200 bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-sm border border-neutral-200 shadow-none rounded-lg p-0 gap-0">
                                <AlertDialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
                                  <AlertDialogTitle className="text-[15px] font-semibold text-neutral-950 tracking-tight">
                                    Delete Leave Policy
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-[12px] text-neutral-400 mt-0.5">
                                    Are you sure? This cannot be undone and may affect existing leave requests.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="px-6 py-4 flex items-center justify-end gap-2 flex-row">
                                  <AlertDialogCancel className="h-9 px-5 rounded-md border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 shadow-none mt-0">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePolicy(policy.id)}
                                    className="h-9 px-5 rounded-md bg-red-600 text-white text-[13px] font-medium hover:bg-red-700 shadow-none"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TD>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Summary — hidden for Hotel Admin and Hotel Owner */}
      {!isHotelAdmin && !roles?.includes("HOTEL_OWNER") && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-neutral-950">My Leave Summary</h3>
            <button
              onClick={toggleLeaveSummary}
              disabled={summaryLoading}
              className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-neutral-200 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40"
            >
              {summaryLoading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" />
                  Loading…
                </>
              ) : showSummary ? (
                <><ChevronUp className="h-3.5 w-3.5" /> Hide</>
              ) : (
                <><ChevronDown className="h-3.5 w-3.5" /> Show</>
              )}
            </button>
          </div>

          {showSummary && leaveSummary && (
            <div className="px-5 py-5 space-y-5">
              {/* Total summary */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-3">
                  Total Summary
                </p>
                <div className="grid grid-cols-2 gap-px bg-neutral-100 rounded-lg overflow-hidden border border-neutral-100">
                  <div className="bg-white px-5 py-4">
                    <p className="text-[22px] font-semibold text-neutral-950 tabular-nums">
                      {leaveSummary.totalDaysTaken}
                    </p>
                    <p className="text-[12px] text-neutral-500 mt-0.5">Days Taken</p>
                  </div>
                  <div className="bg-white px-5 py-4">
                    <p className="text-[22px] font-semibold text-neutral-950 tabular-nums">
                      {leaveSummary.totalDaysRemaining}
                    </p>
                    <p className="text-[12px] text-neutral-500 mt-0.5">Days Remaining</p>
                  </div>
                </div>
              </div>

              {/* By leave type */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-3">
                  By Leave Type
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leaveSummary.leaveTypeDetails.map((lt) => (
                    <div key={lt.leaveTypeId} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="text-[13px] font-semibold text-neutral-950">
                            {lt.leaveTypeName}
                          </p>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {lt.leaveTypeCode} · Max {lt.maxDaysPerYear}/year
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                              lt.isPaid
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-neutral-50 text-neutral-500 border-neutral-200"
                            }`}
                          >
                            {lt.isPaid ? "Paid" : "Unpaid"}
                          </span>
                          {lt.carryForward && (
                            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                              Carry Fwd
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-px bg-neutral-100 rounded-md overflow-hidden border border-neutral-100">
                        <div className="bg-white px-3 py-2.5">
                          <p className="text-[18px] font-semibold text-neutral-950 tabular-nums">
                            {lt.daysTaken}
                          </p>
                          <p className="text-[11px] text-neutral-400">Taken</p>
                        </div>
                        <div className="bg-white px-3 py-2.5">
                          <p className="text-[18px] font-semibold text-neutral-950 tabular-nums">
                            {lt.daysRemaining}
                          </p>
                          <p className="text-[11px] text-neutral-400">Remaining</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leave Request Form Dialog */}
      <Dialog open={showLeaveForm} onOpenChange={setShowLeaveForm}>
        <DialogContent className="max-w-md border border-neutral-200 shadow-none rounded-lg p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1 block">
              {editingLeave ? "Edit Request" : "New Request"}
            </span>
            <DialogTitle className="text-[15px] font-semibold text-neutral-950 tracking-tight">
              {editingLeave ? "Edit Leave Request" : "Request Leave"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitLeave}>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">
                  Leave Type
                </label>
                <Select
                  value={leaveForm.leaveType}
                  onValueChange={(value) => setLeaveForm({ ...leaveForm, leaveType: value })}
                  required
                >
                  <SelectTrigger className="h-9 text-[13px] border-neutral-200 bg-neutral-50 shadow-none focus:ring-0 focus:border-neutral-400">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leavePolicies.filter((p) => p.active).map((policy) => (
                      <SelectItem key={policy.id} value={policy.id.toString()}>
                        {formatLeaveTypeEnum(policy.leaveTypeEnum)} ({policy.maxDaysPerYear} days)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    required
                    className="h-9 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 text-[13px] text-neutral-950 focus:outline-none focus:border-neutral-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    required
                    className="h-9 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 text-[13px] text-neutral-950 focus:outline-none focus:border-neutral-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Reason</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Enter reason for leave…"
                  required
                  rows={3}
                  className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 resize-none transition-colors"
                />
              </div>

              {editingLeave && canEditStatus && (
                <div>
                  <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">Status</label>
                  <Select
                    value={leaveForm.status}
                    onValueChange={(value) => setLeaveForm({ ...leaveForm, status: value })}
                  >
                    <SelectTrigger className="h-9 text-[13px] border-neutral-200 bg-neutral-50 shadow-none focus:ring-0 focus:border-neutral-400">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowLeaveForm(false);
                  setEditingLeave(null);
                  setLeaveForm({ staffId: "", leaveType: "", startDate: "", endDate: "", reason: "", status: "PENDING" });
                }}
                className="h-9 px-5 rounded-md border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-md bg-neutral-950 text-white text-[13px] font-medium hover:opacity-85 transition-opacity"
              >
                {editingLeave ? "Update Request" : "Submit Request"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Leave Policy Form Dialog */}
      <Dialog open={showPolicyForm} onOpenChange={setShowPolicyForm}>
        <DialogContent className="max-w-lg border border-neutral-200 shadow-none rounded-lg p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1 block">
              {editingPolicy ? "Edit Policy" : "New Policy"}
            </span>
            <DialogTitle className="text-[15px] font-semibold text-neutral-950 tracking-tight">
              {editingPolicy ? "Edit Leave Policy" : "Add Leave Policy"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPolicy}>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">
                  Leave Type
                </label>
                <Select
                  value={policyForm.leaveTypeEnum}
                  onValueChange={(value) => setPolicyForm({ ...policyForm, leaveTypeEnum: value })}
                  required
                  disabled={!!editingPolicy}
                >
                  <SelectTrigger className="h-9 text-[13px] border-neutral-200 bg-neutral-50 shadow-none focus:ring-0 focus:border-neutral-400 disabled:opacity-60">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypeEnums.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatLeaveTypeEnum(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">
                  Maximum Days Per Year
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={policyForm.maxDaysPerYear}
                  onChange={(e) => setPolicyForm({ ...policyForm, maxDaysPerYear: e.target.value })}
                  placeholder="e.g., 12"
                  required
                  className="h-9 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 text-[13px] text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">
                  Description
                </label>
                <textarea
                  value={policyForm.description}
                  onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                  placeholder="Enter policy description…"
                  rows={3}
                  className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 resize-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isPaid"
                    checked={policyForm.isPaid}
                    onCheckedChange={(checked) => setPolicyForm({ ...policyForm, isPaid: checked })}
                  />
                  <label htmlFor="isPaid" className="text-[13px] font-medium text-neutral-700 cursor-pointer">
                    Paid Leave
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="carryForward"
                    checked={policyForm.carryForward}
                    onCheckedChange={(checked) => setPolicyForm({ ...policyForm, carryForward: checked })}
                  />
                  <label htmlFor="carryForward" className="text-[13px] font-medium text-neutral-700 cursor-pointer">
                    Carry Forward
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="requiresApproval"
                    checked={policyForm.requiresApproval}
                    onCheckedChange={(checked) => setPolicyForm({ ...policyForm, requiresApproval: checked })}
                  />
                  <label htmlFor="requiresApproval" className="text-[13px] font-medium text-neutral-700 cursor-pointer">
                    Requires Approval
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="active"
                    checked={policyForm.active}
                    onCheckedChange={(checked) => setPolicyForm({ ...policyForm, active: checked })}
                  />
                  <label htmlFor="active" className="text-[13px] font-medium text-neutral-700 cursor-pointer">
                    Active
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowPolicyForm(false);
                  setEditingPolicy(null);
                  setPolicyForm({ leaveTypeEnum: "", isPaid: true, maxDaysPerYear: "", carryForward: false, requiresApproval: true, active: true, description: "" });
                }}
                className="h-9 px-5 rounded-md border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-md bg-neutral-950 text-white text-[13px] font-medium hover:opacity-85 transition-opacity"
              >
                {editingPolicy ? "Update Policy" : "Create Policy"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Leave Confirmation */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="max-w-sm border border-neutral-200 shadow-none rounded-lg p-0 gap-0">
          <AlertDialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
            <AlertDialogTitle className="text-[15px] font-semibold text-neutral-950 tracking-tight">
              Delete Leave Request
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12px] text-neutral-400 mt-0.5">
              Are you sure you want to delete this leave request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-6 py-4 flex items-center justify-end gap-2 flex-row">
            <AlertDialogCancel
              onClick={() => setDeleteConfirmId(null)}
              className="h-9 px-5 rounded-md border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 shadow-none mt-0"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  handleDeleteLeave(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="h-9 px-5 rounded-md bg-red-600 text-white text-[13px] font-medium hover:bg-red-700 shadow-none"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="max-w-sm border border-neutral-200 shadow-none rounded-lg p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1 block">
              Leave Request
            </span>
            <DialogTitle className="text-[15px] font-semibold text-neutral-950 tracking-tight">
              Reject Leave Request
            </DialogTitle>
            <p className="text-[12px] text-neutral-400 mt-1 leading-snug">
              Please provide a reason for rejection. This will be visible to the employee.
            </p>
          </DialogHeader>
          <div className="px-6 py-5">
            <label className="block text-[12px] font-medium text-neutral-600 mb-1.5">
              Rejection Reason *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter the reason for rejection…"
              rows={4}
              required
              className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 resize-none transition-colors"
            />
          </div>
          <div className="px-6 pb-6 flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowRejectionDialog(false);
                setRejectingLeaveId(null);
                setRejectionReason("");
              }}
              className="h-9 px-5 rounded-md border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRejection}
              className="h-9 px-5 rounded-md bg-red-600 text-white text-[13px] font-medium hover:bg-red-700 transition-colors"
            >
              Reject Leave
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default LeaveManagement;
