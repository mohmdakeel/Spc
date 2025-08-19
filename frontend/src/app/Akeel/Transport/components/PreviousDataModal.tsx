import React from "react";
import { X, Clock, RefreshCw, FileDiff } from "lucide-react";

interface Props {
  prevData: Record<string, any>;
  currentData: Record<string, any>;
  onClose: () => void;
  title?: string;
  action?: string;
  timestamp?: string | number;
}

const prettyLabel = (s: string) =>
  s
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, " ")
    .trim();

const PreviousDataModal: React.FC<Props> = ({
  prevData,
  currentData,
  onClose,
  title,
  action,
  timestamp,
}) => {
  const allFields = Array.from(
    new Set([...Object.keys(prevData || {}), ...Object.keys(currentData || {})])
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileDiff size={20} />
            <h2 className="text-lg font-semibold">{title || "Data Comparison"}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:text-orange-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Meta Information */}
        {(action || timestamp) && (
          <div className="px-6 pt-4 flex items-center gap-4 text-sm text-gray-600">
            {action && (
              <div className="flex items-center gap-1">
                <RefreshCw size={16} />
                <span><strong>Action:</strong> {action}</span>
              </div>
            )}
            {timestamp && (
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span><strong>When:</strong> {new Date(Number(timestamp)).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Comparison Table */}
        <div className="p-6 overflow-auto max-h-[70vh]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-orange-50 text-orange-800">
                <th className="p-3 text-left font-semibold">Field</th>
                <th className="p-3 text-left font-semibold">Previous Value</th>
                <th className="p-3 text-left font-semibold">Current Value</th>
              </tr>
            </thead>
            <tbody>
              {allFields.map((field) => {
                const prevVal = prevData?.[field] ?? "-";
                const curVal = currentData?.[field] ?? "-";
                const changed = prevVal !== curVal;
                
                return (
                  <tr 
                    key={field} 
                    className={`border-b ${changed ? "bg-yellow-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="p-3 font-medium text-gray-700">
                      {prettyLabel(field)}
                    </td>
                    <td className={`p-3 ${changed ? "text-red-600 line-through" : ""}`}>
                      {String(prevVal)}
                    </td>
                    <td className={`p-3 ${changed ? "text-green-600 font-semibold" : ""}`}>
                      {String(curVal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 pb-4 flex justify-end border-t border-orange-100 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviousDataModal;
