import { cn } from "@/lib/utils";

export function Spinner({ className, size = "md", ...props }) {
  return (
    <div
      className={cn(
        "relative inline-block",
        size === "sm" && "h-5 w-5",
        size === "md" && "h-8 w-8",
        size === "lg" && "h-12 w-12",
        className
      )}
      {...props}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="spinner-blade" />
      ))}
    </div>
  );
}

