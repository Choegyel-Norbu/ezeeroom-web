import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/dialog";

const FEATURES = [
  { title: "Unlimited hotels", detail: "list and manage as many properties as you own" },
  { title: "Unlimited rooms & staff", detail: "no cap on rooms or team members per property" },
  { title: "Analytics & reporting", detail: "revenue trends, occupancy rates, leave management" },
];

const ProUpgradeDialog = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border border-neutral-200 shadow-none rounded-lg p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-neutral-100 rounded px-2 py-0.5 w-fit mb-4">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-900">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-900">Pro Plan</span>
          </div>
          <DialogTitle className="text-[20px] font-semibold tracking-tight leading-snug text-neutral-950 mb-2">
            Upgrade to unlock more
          </DialogTitle>
          <p className="text-[13px] text-neutral-500 leading-relaxed">
            Your current plan supports one property with limited rooms and staff. Upgrade to Pro to remove all limits.
          </p>
        </DialogHeader>

        <div className="px-6 pb-6 mt-0">
          {/* Divider */}
          <div className="border-t border-neutral-200 my-5" />

          {/* Feature list */}
          <div className="flex flex-col gap-2.5 mb-5">
            {FEATURES.map(({ title, detail }) => (
              <div key={title} className="flex items-start gap-2.5">
                <Check className="h-[15px] w-[15px] text-neutral-900 mt-[1px] flex-shrink-0" strokeWidth={2.5} />
                <span className="text-[13px] text-neutral-500 leading-snug">
                  <span className="font-medium text-neutral-900">{title}</span> — {detail}
                </span>
              </div>
            ))}
          </div>

          {/* Price row */}
          <div className="flex items-baseline gap-1.5 bg-neutral-50 border border-neutral-200 rounded-md px-3.5 py-3 mb-5">
            <span className="text-[22px] font-bold tracking-tighter text-neutral-950 tabular-nums">Nu. 1999</span>
            <span className="text-[13px] font-medium text-neutral-500">/ month</span>
            <span className="text-[12px] text-neutral-400 ml-auto tabular-nums">billed monthly</span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { onOpenChange(false); navigate("/subscription"); }}
              className="flex items-center justify-center gap-1.5 w-full h-9 rounded-md bg-neutral-950 text-white text-[13px] font-medium tracking-tight hover:opacity-85 transition-opacity"
            >
              Upgrade to Pro
              <ArrowRight className="h-[13px] w-[13px]" />
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center w-full h-9 rounded-md bg-white text-neutral-600 text-[13px] font-medium tracking-tight border border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProUpgradeDialog;
