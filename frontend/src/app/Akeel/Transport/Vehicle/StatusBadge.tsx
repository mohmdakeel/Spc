import React from "react";
import { VehicleStatus } from "./types";

const map: Record<VehicleStatus, { bg: string; text: string; label: string }> = {
  ACTIVE:      { bg: "bg-green-100",  text: "text-green-800",  label: "Active" },
  INACTIVE:    { bg: "bg-gray-100",   text: "text-gray-800",   label: "Inactive" },
  MAINTENANCE: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Maintenance" },
  REMOVED:     { bg: "bg-red-100",    text: "text-red-800",    label: "Removed" },
};

export default function StatusBadge({ status }: { status?: VehicleStatus }) {
  const s = status ?? "INACTIVE";
  const v = map[s];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${v.bg} ${v.text}`}>
      {v.label}
    </span>
  );
}
