"use client";
import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean };
export default function Button({ loading, className, children, ...rest }: Props) {
  return (
    <button
      disabled={loading || rest.disabled}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium border",
        "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      {...rest}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
