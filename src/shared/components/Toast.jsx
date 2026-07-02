import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-dismiss in 3s
    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-white border-l-4 border-yellow-400 shadow-lg",
          textColor: "text-gray-800",
          icon: <CheckCircle className="text-yellow-500 w-6 h-6" />,
          iconBg: "bg-yellow-50",
          progressBar: "bg-yellow-400"
        };
      case "error":
        return {
          bgColor: "bg-white border-l-4 border-yellow-400 shadow-lg",
          textColor: "text-gray-800",
          icon: <AlertCircle className="text-yellow-500 w-6 h-6" />,
          iconBg: "bg-yellow-50",
          progressBar: "bg-yellow-400"
        };
      case "warning":
        return {
          bgColor: "bg-white border-l-4 border-yellow-400 shadow-lg",
          textColor: "text-gray-800",
          icon: <AlertTriangle className="text-yellow-500 w-6 h-6" />,
          iconBg: "bg-yellow-50",
          progressBar: "bg-yellow-400"
        };
      case "info":
      default:
        return {
          bgColor: "bg-white border-l-4 border-yellow-400 shadow-lg",
          textColor: "text-gray-800",
          icon: <Info className="text-yellow-500 w-6 h-6" />,
          iconBg: "bg-yellow-50",
          progressBar: "bg-yellow-400"
        };
    }
  };

  const { bgColor, textColor, icon, iconBg, progressBar } = getToastStyles();

  return (
    <div
      className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 ${bgColor} rounded-lg overflow-hidden transition-all duration-300 ease-out animate-slide-down`}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 h-1 w-full bg-gray-100">
        <div 
          className={`h-full ${progressBar} animate-progress`}
          style={{
            animation: 'progress 3s linear forwards'
          }}
        />
      </div>
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon container */}
          <div className={`flex-shrink-0 p-1 rounded-full ${iconBg}`}>
            {icon}
          </div>
          
          {/* Message content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-5 ${textColor}`}>
              {message}
            </p>
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
            aria-label="Close notification"
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
        
        .animate-progress {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;