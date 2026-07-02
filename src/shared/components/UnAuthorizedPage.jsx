import { AlertTriangle, ArrowLeft, Home, Shield } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Card, CardContent } from "@/shared/components/card";

export default function UnauthorizedPage() {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    // Replace with your actual home route
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center p-4" style={{ backgroundColor: '#050203' }}>
      <div className="w-full max-w-md">
        <Card className="border-zinc-800 bg-zinc-950">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon */}
              <div className="relative">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-red-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">
                  Access Denied
                </h1>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
                </p>
              </div>

              {/* Error Code */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2">
                <span className="text-xs font-mono text-zinc-500">
                  Error Code: 403
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={handleGoBack}
                  className="flex-1 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
                <Button
                  onClick={handleGoHome}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-zinc-800 w-full">
                <p className="text-xs text-zinc-500">
                  Yakrooms Hotel Management System
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}