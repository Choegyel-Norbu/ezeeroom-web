import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/dialog";
import { Button } from "@/shared/components/button";
import { Card, CardContent } from "@/shared/components/card";

function DeleteConfirmationDialog({ onConfirm }) {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    onConfirm(); // call the parent-provided deletion logic
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {/* <Card className="p-4 shadow-lg border-none"> */}
        <CardContent className="p-0 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-destructive">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </CardContent>
        {/* </Card> */}
      </DialogContent>
    </Dialog>
  );
}

export default DeleteConfirmationDialog;
