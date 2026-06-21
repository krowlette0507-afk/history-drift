"use client";

import { cn } from "@/lib/cn";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "ghost" | "outline" | "chalk";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "gold", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-serif font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-600/50 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-amber-50 shadow-lg hover:shadow-amber-900/40 active:scale-95":
              variant === "gold",
            "bg-transparent hover:bg-amber-950/40 text-amber-200 border border-amber-800/40 hover:border-amber-600/60":
              variant === "ghost",
            "bg-transparent border border-amber-600/60 text-amber-300 hover:bg-amber-900/30 hover:border-amber-500":
              variant === "outline",
            "bg-stone-800/80 border border-amber-900/50 text-amber-100 hover:bg-stone-700/80 hover:border-amber-700/60":
              variant === "chalk",
          },
          {
            "px-3 py-1.5 text-sm rounded-md": size === "sm",
            "px-5 py-2.5 text-base rounded-lg": size === "md",
            "px-7 py-3.5 text-lg rounded-xl": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
