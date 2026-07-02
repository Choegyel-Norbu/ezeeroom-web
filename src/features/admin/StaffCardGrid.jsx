import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, Users, XCircle } from 'lucide-react';
import api from "../../shared/services/Api";

const getInitials = (name) => {
  if (!name) return 'ST';
  return name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const formatJoinDate = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
};

const StaffCard = ({ staff }) => (
  <div className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-col gap-3">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-full bg-neutral-950 text-white text-[12px] font-semibold flex items-center justify-center flex-shrink-0 overflow-hidden">
        {staff.profilePictureUrl ? (
          <img src={staff.profilePictureUrl} alt={staff.fullName || 'Staff'} className="h-9 w-9 object-cover" />
        ) : (
          getInitials(staff.fullName)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-neutral-950 truncate">{staff.fullName || '—'}</p>
        {staff.position && (
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600 mt-0.5">
            {staff.position}
          </span>
        )}
      </div>
    </div>
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Mail className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
        <span className="text-[12px] text-neutral-500 truncate">{staff.staffEmail || '—'}</span>
      </div>
      <div className="flex items-center gap-2">
        <Phone className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
        <span className="text-[12px] text-neutral-500">{staff.number || '—'}</span>
      </div>
      {formatJoinDate(staff.dateJoined) && (
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
          <span className="text-[12px] text-neutral-400">{formatJoinDate(staff.dateJoined)}</span>
        </div>
      )}
    </div>
  </div>
);

const StaffCardSkeleton = () => (
  <div className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-col gap-3">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-full bg-neutral-100 animate-pulse flex-shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-3.5 bg-neutral-100 animate-pulse rounded w-28" />
        <div className="h-3 bg-neutral-100 animate-pulse rounded w-16" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-neutral-100 animate-pulse rounded w-40" />
      <div className="h-3 bg-neutral-100 animate-pulse rounded w-28" />
      <div className="h-3 bg-neutral-100 animate-pulse rounded w-32" />
    </div>
  </div>
);

const StaffCardGrid = ({ hotelId, className = "" }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/staff/hotel/${hotelId}`);
      const staffData = res.data?.content || res.data || [];
      setStaff(staffData);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No staff members found for this hotel.');
      } else {
        setError('Failed to load staff members. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) fetchStaff();
    else setLoading(false);
  }, [hotelId]);

  if (error) {
    return (
      <div className={`bg-white border border-neutral-200 rounded-lg overflow-hidden ${className}`}>
        <div className="flex items-start gap-3 border-l-2 border-l-red-500 px-5 py-4">
          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-neutral-950">Failed to load staff directory</p>
            <p className="text-[12px] text-neutral-500 mt-0.5">{error}</p>
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
    <div className={`bg-white border border-neutral-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
        <Users className="h-[14px] w-[14px] text-neutral-500" />
        <h3 className="text-[13px] font-semibold text-neutral-950">Staff Directory</h3>
        {!loading && (
          <span className="ml-1 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
            {staff.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <StaffCardSkeleton key={i} />)}
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-neutral-400" />
            </div>
            <p className="text-[13px] font-medium text-neutral-950">No staff members</p>
            <p className="text-[12px] text-neutral-500 mt-1">Add your first team member below.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {staff.map((staffMember) => (
              <StaffCard key={staffMember.staffId} staff={staffMember} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffCardGrid;
