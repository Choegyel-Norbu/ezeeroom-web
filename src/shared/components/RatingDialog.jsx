import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/shared/components/dialog";
import { Switch } from "@/shared/components/switch";
import api from "@/shared/services/Api";
import { useAuth } from "@/features/authentication/AuthProvider";

const SCALE = Array.from({ length: 10 }, (_, i) => i + 1);

const getRatingLabel = (v) => {
  if (v <= 2) return "Very poor";
  if (v <= 4) return "Poor";
  if (v <= 6) return "Fair";
  if (v <= 8) return "Good";
  return "Excellent";
};

const RatingDialog = ({ open, onOpenChange }) => {
  const { authState } = useAuth();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(0);
      setHovered(0);
      setComment("");
      setIsAnonymous(true);
      setIsSuccess(false);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAnonymous && rating === 0) return;

    setIsSubmitting(true);
    try {
      const feedbackData = {
        rating,
        comment: comment.trim() || "",
        userId: isAnonymous ? null : authState.userId,
        isAnonymous,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${screen.width}x${screen.height}`,
          timestamp: new Date().toISOString(),
        },
      };
      const response = await api.post("/feedbacks", feedbackData);
      if (response.status === 200 || response.status === 201) {
        setIsSuccess(true);
        setTimeout(() => onOpenChange(false), 2000);
      }
    } catch {
      // silent
    } finally {
      setIsSubmitting(false);
    }
  };

  const active = hovered || rating;

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px] w-full p-0 overflow-hidden rounded-lg border border-neutral-200 shadow-none gap-0">
          <div className="flex flex-col items-center justify-center gap-3 py-14 px-10 text-center">
            <div className="w-11 h-11 rounded-full border border-neutral-200 bg-neutral-950 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-[15px] font-semibold text-neutral-950 tracking-tight">Thank you for your feedback</p>
            <p className="text-[13px] text-neutral-500 leading-relaxed max-w-xs">
              Your input helps us make EzeeRoom better for everyone.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] w-full p-0 overflow-hidden rounded-lg border border-neutral-200 shadow-none gap-0">

        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-neutral-100">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">Feedback</span>
          <h2 className="mt-2 text-[18px] font-semibold text-neutral-950 tracking-tight leading-snug">Rate your experience</h2>
          <p className="mt-1 text-[13px] text-neutral-500 leading-relaxed">Help us improve EzeeRoom by sharing your thoughts.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-7 py-6 space-y-6">

            {/* Score scale */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">
                  Overall score{!isAnonymous && <span className="text-neutral-950 ml-0.5">*</span>}
                </span>
                {active > 0 && (
                  <span className="text-[12px] font-medium text-neutral-500 tabular-nums">
                    {active} / 10 &mdash; <span className="text-neutral-950 font-semibold">{getRatingLabel(active)}</span>
                  </span>
                )}
              </div>

              <div className="flex gap-1">
                {SCALE.map((n) => {
                  const isSelected = rating === n;
                  const isHighlighted = active >= n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      className={[
                        "flex-1 h-9 rounded-md text-[13px] font-semibold transition-all duration-100 select-none border",
                        isSelected
                          ? "bg-neutral-950 text-white border-neutral-950"
                          : isHighlighted
                          ? "bg-neutral-100 text-neutral-900 border-neutral-200"
                          : "bg-white text-neutral-400 border-neutral-200 hover:bg-neutral-50 hover:text-neutral-700",
                      ].join(" ")}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between text-[11px] text-neutral-400 font-medium">
                <span>Not satisfied</span>
                <span>Very satisfied</span>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <label htmlFor="comment" className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">
                Additional comments <span className="normal-case font-normal text-neutral-400">(optional)</span>
              </label>
              <textarea
                id="comment"
                placeholder="Tell us more about your experience…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full resize-none rounded-md border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-[13px] text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-400 focus:bg-white"
              />
              <div className="text-right text-[11px] text-neutral-400 tabular-nums">
                {comment.length} / 500
              </div>
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-center justify-between py-4 border-t border-neutral-100">
              <div>
                <p className="text-[13px] font-medium text-neutral-950">Submit anonymously</p>
                <p className="text-[12px] text-neutral-400 mt-0.5">Your identity will remain private</p>
              </div>
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>

          </div>

          {/* Footer */}
          <div className="px-7 pb-7 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-[13px] font-medium text-neutral-400 hover:text-neutral-700 transition-colors disabled:opacity-40"
            >
              Maybe later
            </button>
            <button
              type="submit"
              disabled={(!isAnonymous && rating === 0) || isSubmitting}
              className="ml-auto flex items-center gap-2 h-9 rounded-md bg-neutral-950 px-5 text-[13px] font-medium text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:opacity-100"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit rating"
              )}
            </button>
          </div>
        </form>

      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;
