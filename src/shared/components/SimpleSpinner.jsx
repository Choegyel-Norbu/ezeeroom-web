import React from 'react';
import { Spinner } from '@/components/ui/ios-spinner';

const SimpleSpinner = ({ 
  size = 32, 
  className = "",
  text = "Loading..."
}) => {
  // Map numeric size to Spinner size prop
  const spinnerSize = size <= 16 ? "sm" : size <= 24 ? "md" : "lg";
  
  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <Spinner size={spinnerSize} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
};

export default SimpleSpinner;
