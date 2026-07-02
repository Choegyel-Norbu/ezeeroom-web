import { cn } from "@/shared/utils";

export function IOSSpinner({ className, size = "md", ...props }) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        size === "sm" && "h-8 w-8",
        size === "md" && "h-12 w-12",
        size === "lg" && "h-16 w-16",
        className
      )}
      {...props}
    >
      {/* Spinner blades */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="spinner-blade" />
      ))}
      
      {/* ER text in the center - positioned absolutely to be centered */}
      <span className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-[#050203] z-10 leading-none",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        size === "lg" && "text-base"
      )}>
        ER
      </span>
    </div>
  );
}

