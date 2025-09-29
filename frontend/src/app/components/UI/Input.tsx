"use client";
import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };

const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className, ...rest }, ref) => (
  <label className="block">
    {label && <span className="mb-1 block text-sm text-gray-700">{label}</span>}
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-lg border px-3 py-2 outline-none",
        "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
        error ? "border-red-500" : "border-gray-300",
        className
      )}
      {...rest}
    />
    {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
  </label>
));
Input.displayName = "Input";
export default Input;
