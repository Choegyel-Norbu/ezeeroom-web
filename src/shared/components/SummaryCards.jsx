// SummaryCards.jsx
import React from "react";
import { Calendar, Check, Clock, X } from "lucide-react";

const SummaryCards = ({ rooms, bookings, notifications, markAsRead }) => {
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((room) => room.active).length;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyBookings = bookings.filter((booking) =>
    booking.checkIn.startsWith(currentMonth)
  ).length;

  const pendingCheckIns = bookings.filter(
    (booking) =>
      booking.status === "confirmed" && new Date(booking.checkIn) > new Date()
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Rooms */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Rooms</p>
            <p className="text-2xl font-bold">{totalRooms}</p>
          </div>
          <div className="bg-amber-100 p-3 rounded-full text-amber-600">
            <Check size={20} />
          </div>
        </div>
      </div>

      {/* Available Rooms */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Available Now</p>
            <p className="text-2xl font-bold">{availableRooms}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <Check size={20} />
          </div>
        </div>
      </div>

      {/* Monthly Bookings */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">This Month's Bookings</p>
            <p className="text-2xl font-bold">{monthlyBookings}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Calendar size={20} />
          </div>
        </div>
      </div>

      {/* Pending Check-ins */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Pending Check-ins</p>
            <p className="text-2xl font-bold">{pendingCheckIns}</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-full text-purple-600">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="lg:col-span-4 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-2">Notifications</h3>
          <ul className="divide-y">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`py-2 ${!notification.read ? "bg-amber-50" : ""}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="space-y-1">
                  <p className={`${!notification.read ? "font-medium" : ""}`}>
                    {notification.title}
                  </p>
                  <div className="text-xs text-gray-600 space-y-1">
                    {notification.username && (
                      <div><span className="font-medium">User:</span> {notification.username}</div>
                    )}
                    {notification.roomNumber && (
                      <div><span className="font-medium">Room:</span> {notification.roomNumber}</div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {notification.date || notification.createdAt}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SummaryCards;
