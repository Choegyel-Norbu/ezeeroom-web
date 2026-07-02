import React from 'react';
import { Search } from 'lucide-react';
import { Spinner } from '@/components/ui/ios-spinner';
import { Button } from './button';

const SearchButton = ({ children, className, loading, loadingText, ...props }) => {
  return (
    <Button 
      type="submit" 
      className={className} 
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="mr-2" />
          {loadingText || children}
        </>
      ) : (
        <>
          <Search className="w-4 h-4 mr-2" />
          {children}
        </>
      )}
    </Button>
  );
};

export default SearchButton;
