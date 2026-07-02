import { ToastContainer } from "react-toastify";
import AppRouting from "./routes/AppRouting";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider, GoogleOneTap } from "./features/authentication";
import { SubscriptionProvider } from "./features/subscription";
import { PWARegistration } from "./modules/pwa";
import InternetConnectionMonitor from "./shared/components/InternetConnectionMonitor";
import RootPathHandler from "./components/RootPathHandler";
import RatingDialogProvider from "./shared/components/RatingDialogProvider";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <RootPathHandler />
          <GoogleOneTap />
          <AppRouting />
          <PWARegistration />
          <InternetConnectionMonitor />
          <RatingDialogProvider />
          <ToastContainer position="top-center" />
          <Toaster
            position="top-center"
            closeButton={true}
            duration={4000}
            classNames={{
              toast: "!bg-neutral-950 !border !border-neutral-800 !rounded-md !shadow-none !font-sans",
              title: "!text-[13px] !font-medium !text-white",
              description: "!text-[12px] !text-neutral-400",
              success: "!border-l-4 !border-l-emerald-400",
              error: "!border-l-4 !border-l-red-400",
              warning: "!border-l-4 !border-l-amber-400",
              info: "!border-l-4 !border-l-neutral-500",
              closeButton: "!bg-neutral-800 !border-neutral-700 !text-neutral-400",
              icon: "!text-neutral-300",
            }}
          />
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
