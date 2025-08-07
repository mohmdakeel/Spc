import React from "react";
import { X } from "lucide-react";

// Format date and handle null/undefined
const formatDate = (val: any) =>
  val ? new Date(val).toLocaleString() : "-";

// Humanize labels for display
const prettyLabel = (label: string) =>
  label
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, " ")
    .trim();

// Which keys are meta/info fields
const metaFields = [
  "createdBy",
  "createdAt",
  "updatedBy",
  "updatedAt",
  "deletedBy",
  "deletedAt",
];

interface Props {
  prevData: Record<string, any>;
  onClose: () => void;
  title?: string;
}

// Optionally format specific fields for best readability
function fieldValue(key: string, value: any) {
  if (key.toLowerCase().includes("date") && value) return formatDate(value);
  if (key.toLowerCase().includes("status")) {
    // Map code to label if needed
    if (value === "ACTIVE") return "Active";
    if (value === "INACTIVE") return "Inactive";
    if (value === "SUSPENDED") return "Suspended";
    return value || "-";
  }
  if (key.toLowerCase().includes("experience")) {
    if (value === null || value === undefined || value === "") return "-";
    return `${value} year${value === 1 ? "" : "s"}`;
  }
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

const PreviousDataModal: React.FC<Props> = ({ prevData, onClose, title }) => {
  // Split out meta and detail fields
  const meta: Record<string, any> = {};
  const details: Record<string, any> = {};

  Object.entries(prevData || {}).forEach(([k, v]) => {
    if (metaFields.includes(k)) meta[k] = v;
    else details[k] = v;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{title || "Previous Data"}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-orange-200 transition-colors"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Meta info */}
        <div className="bg-gray-50 px-6 pt-4 pb-2 border-b border-orange-100">
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
            {meta.createdBy && (
              <div>
                <span className="font-semibold">Created By:</span> {meta.createdBy}
              </div>
            )}
            {meta.createdAt && (
              <div>
                <span className="font-semibold">Created At:</span> {formatDate(meta.createdAt)}
              </div>
            )}
            {meta.updatedBy && (
              <div>
                <span className="font-semibold">Modified By:</span> {meta.updatedBy}
              </div>
            )}
            {meta.updatedAt && (
              <div>
                <span className="font-semibold">Modified At:</span> {formatDate(meta.updatedAt)}
              </div>
            )}
            {meta.deletedBy && (
              <div>
                <span className="font-semibold">Deleted By:</span> {meta.deletedBy}
              </div>
            )}
            {meta.deletedAt && (
              <div>
                <span className="font-semibold">Deleted At:</span> {formatDate(meta.deletedAt)}
              </div>
            )}
          </div>
        </div>

        {/* Main details */}
        <div className="p-6 pb-3">
          {Object.keys(details).length === 0 ? (
            <div className="text-gray-400 text-center">No previous data.</div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="flex gap-4 items-center">
                  <div className="w-40 font-medium text-gray-800 bg-orange-50 px-3 py-2 rounded">
                    {prettyLabel(key)}
                  </div>
                  <div className="flex-1 break-words text-gray-700 px-3 py-2 bg-gray-50 rounded">
                    {fieldValue(key, value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviousDataModal;
