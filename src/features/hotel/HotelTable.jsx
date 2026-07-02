// HotelTable.jsx
import React from "react";
import { Eye, Check, X, Clock, CheckCircle, XCircle } from "lucide-react";

const StatusBadge = ({ status }) => {
  const statusMap = {
    pending: {
      icon: <Clock className="text-amber-500" size={16} />,
      text: "Pending",
      bg: "bg-amber-100",
      textColor: "text-amber-800",
    },
    approved: {
      icon: <CheckCircle className="text-green-500" size={16} />,
      text: "Approved",
      bg: "bg-green-100",
      textColor: "text-green-800",
    },
    rejected: {
      icon: <XCircle className="text-red-500" size={16} />,
      text: "Rejected",
      bg: "bg-red-100",
      textColor: "text-red-800",
    },
  };

  const currentStatus = statusMap[status];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${currentStatus.bg} ${currentStatus.textColor}`}
    >
      {currentStatus.icon}
      <span className="ml-1">{currentStatus.text}</span>
    </span>
  );
};

const HotelTable = ({ listings, onView, onApprove, onReject }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Hotel Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Owner
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Location
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Submitted
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {listings.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                No listings found matching your filters
              </td>
            </tr>
          ) : (
            listings.map((listing) => (
              <tr key={listing.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {listing.hotelName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {listing.owner.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {listing.owner.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {listing.location.city}
                  </div>
                  <div className="text-sm text-gray-500">
                    {listing.location.district}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {listing.submissionDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={listing.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onView(listing)}
                      className="text-amber-600 hover:text-amber-900 cursor-pointer"
                      aria-label="View hotel details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    {listing.status !== "approved" && (
                      <button
                        onClick={() => onApprove(listing.id)}
                        className="text-green-600 hover:text-green-900 cursor-pointer"
                        aria-label="Approve hotel listing"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    )}
                    {listing.status !== "rejected" && (
                      <button
                        onClick={() => onReject(listing.id)}
                        className="text-red-600 hover:text-red-900 cursor-pointer"
                        aria-label="Reject hotel listing"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default HotelTable;
