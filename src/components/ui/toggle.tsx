import React from "react";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "primary";
}

export function Toggle({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  size = "md",
  variant = "default"
}: ToggleProps) {
  const sizeClasses = {
    sm: "w-8 h-4",
    md: "w-12 h-6",
    lg: "w-16 h-8"
  };

  const knobSizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7"
  };

  const variantClasses = {
    default: {
      checked: "bg-gray-900",
      unchecked: "bg-gray-200"
    },
    success: {
      checked: "bg-green-500",
      unchecked: "bg-red-400"
    },
    primary: {
      checked: "bg-blue-500",
      unchecked: "bg-gray-300"
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        checked 
          ? variantClasses[variant].checked
          : variantClasses[variant].unchecked,
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out",
          checked 
            ? "translate-x-6" 
            : "translate-x-1",
          knobSizeClasses[size]
        )}
      />
    </button>
  );
} 