import React from "react";
import RatingDialog from "./RatingDialog";
import { useRatingDialog } from "../hooks";

/**
 * RatingDialogProvider Component
 * Wraps the RatingDialog with the useRatingDialog hook
 * This component should be placed inside the AuthProvider context
 */
const RatingDialogProvider = () => {
  const { isOpen, onOpenChange } = useRatingDialog();

  return (
    <RatingDialog
      open={isOpen}
      onOpenChange={onOpenChange}
    />
  );
};

export default RatingDialogProvider;
