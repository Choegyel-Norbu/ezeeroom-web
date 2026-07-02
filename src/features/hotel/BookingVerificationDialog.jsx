import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/dialog";
import { CheckCircle, CreditCard, KeyRound } from "lucide-react";
import { toast } from "sonner";
import CIDVerification from "./CIDVerification";
import PasscodeVerification from "./PasscodeVerification";

const METHODS = [
  { key: "cid", label: "CID", icon: CreditCard },
  { key: "passcode", label: "Passcode", icon: KeyRound },
];

const BookingVerificationDialog = ({ isDisabled = false }) => {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("cid");

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isDisabled) {
            toast.error("Subscription expired. Please renew your subscription to verify bookings.", { duration: 6000 });
            return;
          }
          setOpen(true);
        }}
        className="h-9 px-4 rounded-md border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center gap-2"
      >
        <CheckCircle className="h-4 w-4" />
        Verify Booking
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg border border-neutral-200 shadow-none rounded-lg p-0 gap-0 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-neutral-100">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 block">
              Guest Verification
            </span>
            <DialogTitle className="text-[15px] font-semibold text-neutral-950 flex items-center gap-2 mt-0.5">
              <CheckCircle className="h-4 w-4" />
              Booking Verification
            </DialogTitle>
            <p className="text-[13px] text-neutral-500 mt-1">
              {method === "cid"
                ? "Enter the guest's CID number to verify their booking"
                : "Enter the room passcode to verify the guest booking"}
            </p>
          </DialogHeader>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            {/* Method toggle */}
            <div className="flex rounded-md border border-neutral-200 overflow-hidden h-9 w-fit">
              {METHODS.map((m, i) => {
                const Icon = m.icon;
                const active = method === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key)}
                    className={`flex items-center gap-1.5 px-4 text-[12px] font-medium whitespace-nowrap transition-colors ${
                      i > 0 ? "border-l border-neutral-200" : ""
                    } ${
                      active
                        ? "bg-neutral-950 text-white"
                        : "bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {method === "cid" ? (
              <CIDVerification compact />
            ) : (
              <PasscodeVerification compact />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingVerificationDialog;
