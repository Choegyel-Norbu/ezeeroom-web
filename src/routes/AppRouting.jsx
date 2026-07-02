import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../features/authentication";
import SimpleSpinner from "@/shared/components/SimpleSpinner";

// ============================================
// LAZY LOADED ROUTE COMPONENTS
// ============================================
// This implements code splitting to reduce initial bundle size
// Each route is loaded on-demand when the user navigates to it

// Public Routes - Landing & Info Pages
const Landing = lazy(() => import("../features/landing").then(m => ({ default: m.Landing })));
const AboutUs = lazy(() => import("../features/landing").then(m => ({ default: m.AboutUs })));
const FAQs = lazy(() => import("../features/landing").then(m => ({ default: m.FAQs })));
const PrivacyPolicy = lazy(() => import("../features/landing").then(m => ({ default: m.PrivacyPolicy })));
const TermsAndConditions = lazy(() => import("../features/landing").then(m => ({ default: m.TermsAndConditions })));

// Hotel Routes
const HotelListingPage = lazy(() => import("../features/hotel").then(m => ({ default: m.HotelListingPage })));
const HotelDetailsPage = lazy(() => import("../features/hotel").then(m => ({ default: m.HotelDetailsPage })));
const AddListingPage = lazy(() => import("../features/hotel").then(m => ({ default: m.AddListingPage })));
const HotelAdminDashboard = lazy(() => import("../features/hotel").then(m => ({ default: m.HotelAdminDashboard })));
const AccountDeletionPage = lazy(() => import("../features/hotel").then(m => ({ default: m.AccountDeletionPage })));
const UserManual = lazy(() => import("../features/hotel").then(m => ({ default: m.UserManual })));

// Admin & Dashboard Routes
const SuperAdmin = lazy(() => import("../features/admin").then(m => ({ default: m.SuperAdmin })));
const GuestDashboard = lazy(() => import("../features/guest").then(m => ({ default: m.GuestDashboard })));

// Subscription & Payment Routes
const SubscriptionPage = lazy(() => import("../features/subscription").then(m => ({ default: m.SubscriptionPage })));
const SubscriptionManagement = lazy(() => import("../shared/components").then(m => ({ default: m.SubscriptionManagement })));
const PaymentPage = lazy(() => import("../features/payment").then(m => ({ default: m.PaymentPage })));

// ============================================
// LOADING FALLBACK COMPONENT
// ============================================
// Shown while lazy-loaded components are being fetched
const RouteLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <SimpleSpinner size={32} text="Loading..." />
  </div>
);

// ============================================
// PROTECTED ROUTE COMPONENT
// ============================================
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, hasRole, roles, userId, email } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if user has any of the allowed roles
  const hasAllowedRole = allowedRoles.some((role) => hasRole(role));

  if (!hasAllowedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Dashboard Route Component
const DashboardRoute = () => {
  const { getCurrentActiveRole } = useAuth();
  const activeRole = getCurrentActiveRole();

  // Redirect based on active role
  if (activeRole === "SUPER_ADMIN") {
    return <Navigate to="/adminDashboard" replace />;
  } else if (activeRole === "HOTEL_ADMIN" || activeRole === "STAFF" || activeRole === "MANAGER" || activeRole === "FRONTDESK") {
    return <Navigate to="/hotelAdmin" replace />;
  } else if (activeRole === "GUEST") {
    return <Navigate to="/guestDashboard" replace />;
  } else {
    // Fallback to home if no valid role
    return <Navigate to="/" replace />;
  }
};

// Unauthorized Page Component
const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-4">
        You don't have permission to access this page.
      </p>
      <button
        onClick={() => window.history.back()}
        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
      >
        Go Back
      </button>
    </div>
  </div>
);

const AppRouting = () => {

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
      <Route path="/aboutus" element={<AboutUs />} />
      <Route path="/faqs" element={<FAQs />} />
      <Route path="/hotels" element={<HotelListingPage />} />
      <Route path="/hotel/:id" element={<HotelDetailsPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute allowedRoles={["HOTEL_ADMIN", "MANAGER"]}>
            <SubscriptionPage />
          </ProtectedRoute>
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Dashboard Route - Redirects based on active role */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={["HOTEL_ADMIN", "SUPER_ADMIN", "STAFF", "MANAGER", "GUEST", "FRONTDESK"]}
          >
            <DashboardRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/addListing"
        element={
          <ProtectedRoute allowedRoles={["GUEST", "HOTEL_ADMIN", "STAFF", "MANAGER", "FRONTDESK"]}>
            <AddListingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes */}

      <Route
        path="/hotelAdmin"
        element={
          <ProtectedRoute allowedRoles={["HOTEL_ADMIN", "STAFF", "MANAGER", "FRONTDESK"]}>
            <HotelAdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/adminDashboard"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/guestDashboard"
        element={
          <ProtectedRoute allowedRoles={["GUEST"]}>
            <GuestDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account-deletion"
        element={
          <ProtectedRoute allowedRoles={["HOTEL_ADMIN"]}>
            <AccountDeletionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/subscription-management"
        element={
          <ProtectedRoute allowedRoles={["HOTEL_ADMIN", "STAFF", "MANAGER"]}>
            <SubscriptionManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/help"
        element={
          <ProtectedRoute allowedRoles={["HOTEL_ADMIN", "STAFF", "MANAGER", "FRONTDESK"]}>
            <UserManual />
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouting;
