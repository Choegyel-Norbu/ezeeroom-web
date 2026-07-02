import React, { useState } from "react";
import { cn } from "@/lib/utils";

const AvatarCircles = ({
  hasMore = false,
  className,
  avatarUrls = [],
}) => {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (index) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  if (!avatarUrls || avatarUrls.length === 0) {
    return null;
  }

  // Show up to 3 avatars
  const visibleAvatars = avatarUrls.slice(0, 3);

  return (
    <div className={cn("z-10 flex -space-x-2 rtl:space-x-reverse items-center", className)}>
      {visibleAvatars.map((url, index) => (
        <div key={index} className="relative">
          {imageErrors[index] ? (
            <div className="h-6 w-6 rounded-full border border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-[10px] text-gray-500">?</span>
            </div>
          ) : (
            <img
              className="h-6 w-6 rounded-full border border-white dark:border-gray-800 object-cover"
              src={url}
              width={24}
              height={24}
              alt={`Reviewer avatar ${index + 1}`}
              onError={() => handleImageError(index)}
            />
          )}
        </div>
      ))}
      {hasMore && (
        <div
          className="flex h-7 w-7 min-w-[28px] items-center justify-center rounded-full border border-gray-300 bg-white text-center text-[11px] font-medium text-[#050203] hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white cursor-default"
          title="More reviews available"
        >
          3+
        </div>
      )}
    </div>
  );
};

export { AvatarCircles };
