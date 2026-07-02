// HotelReviewModal.jsx
import React from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Bed,
  Wifi,
  Tv,
  Snowflake,
  Waves,
} from "lucide-react";

const HotelReviewModal = ({
  listing,
  onClose,
  onApprove,
  onReject,
  rejectReason,
  setRejectReason,
  adminNote,
  setAdminNote,
  addAdminNote,
}) => {
  const getAmenityIcon = (amenity) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="h-3 w-3 text-blue-500" />;
      case "tv":
        return <Tv className="h-3 w-3 text-purple-500" />;
      case "ac":
        return <Snowflake className="h-3 w-3 text-teal-500" />;
      case "pool":
        return <Waves className="h-3 w-3 text-blue-400" />;
      default:
        return <Bed className="h-3 w-3 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div
            className="absolute inset-0 bg-gray-500 opacity-75"
            onClick={onClose}
          ></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {listing.hotelName} - Review Listing
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div>
                {/* Hotel Info */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    HOTEL INFORMATION
                  </h4>
                  <p className="text-gray-700 mb-4">{listing.description}</p>

                  <div className="flex items-start mb-2">
                    <MapPin className="text-gray-400 mr-2 mt-1 flex-shrink-0" size={18} />
                    <div>
                      <p className="text-gray-700">
                        {listing.location.city}, {listing.location.district}
                      </p>
                      {listing.address && (
                        <p className="text-gray-500 text-sm">
                          {listing.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Owner Info */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    OWNER INFORMATION
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="text-gray-400 mr-2" size={18} />
                      <span className="text-gray-700">
                        {listing.owner.name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="text-gray-400 mr-2" size={18} />
                      <span className="text-gray-700">
                        {listing.owner.email}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="text-gray-400 mr-2" size={18} />
                      <span className="text-gray-700">
                        {listing.owner.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    DOCUMENTS
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <FileText className="text-gray-400 mr-2" size={18} />
                      <a href="#" className="text-amber-600 hover:underline">
                        Trade License: {listing.documents.license}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <FileText className="text-gray-400 mr-2" size={18} />
                      <a href="#" className="text-amber-600 hover:underline">
                        ID Proof: {listing.documents.idProof}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                {/* Images */}
                {listing.images.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      IMAGES
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {listing.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Hotel ${index}`}
                          className="w-full h-24 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Rooms */}
                {listing.rooms.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      ROOMS
                    </h4>
                    <div className="space-y-3">
                      {listing.rooms.map((room, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between">
                            <h5 className="font-medium">{room.type}</h5>
                            <span className="text-amber-600">
                              Nu. {room.price}
                            </span>
                          </div>
                          {room.amenities.length > 0 && (
                            <div className="mt-2">
                              <h6 className="text-xs text-gray-500 mb-1">
                                Amenities:
                              </h6>
                              <div className="flex flex-wrap gap-2">
                                {room.amenities.map((amenity, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded"
                                  >
                                    {getAmenityIcon(amenity)}
                                    <span className="ml-1">{amenity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    ADMIN NOTES
                  </h4>
                  <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
                    {listing.adminNotes.length > 0 ? (
                      listing.adminNotes.map((note, index) => (
                        <div
                          key={index}
                          className="text-sm p-2 bg-gray-50 rounded"
                        >
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{note.admin}</span>
                            <span>{note.date}</span>
                          </div>
                          <p className="text-gray-700">{note.note}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No notes yet</p>
                    )}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add internal note..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm"
                    />
                    <button
                      onClick={() => addAdminNote(listing.id)}
                      className="px-3 py-2 bg-amber-500 text-white text-sm rounded-r-lg hover:bg-amber-600 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rejection Reason (conditionally shown) */}
          {listing.status !== "approved" && (
            <div className="bg-gray-50 px-4 py-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Provide reason for rejection (will be shared with owner)"
              />
            </div>
          )}

          {/* Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {listing.status !== "approved" && (
              <button
                type="button"
                onClick={() => onApprove(listing.id)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm cursor-pointer"
              >
                Approve Listing
              </button>
            )}
            {listing.status !== "rejected" && (
              <button
                type="button"
                onClick={() => onReject(listing.id)}
                disabled={!rejectReason && listing.status !== "rejected"}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm cursor-pointer ${
                  !rejectReason && listing.status !== "rejected"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                Reject Listing
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelReviewModal;
