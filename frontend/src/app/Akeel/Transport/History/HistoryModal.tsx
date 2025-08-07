import React, { useState } from "react";
import { HistoryItem } from "../services/historyService";
import PreviousDataModal from "../components/PreviousDataModal";
import { X, Clock, User, RefreshCw, Trash2, Plus, FileDiff, ChevronRight } from "lucide-react";

function safeParse(json: string | null): Record<string, any> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// Define Props interface
interface Props {
  item: HistoryItem;
  onClose: () => void;
}

const HistoryModal = ({ item, onClose }: Props) => {
  const [prevOpen, setPrevOpen] = useState(false);
  const [currentData, setCurrentData] = useState<any>(null);
  const prevData = safeParse(item.previousData);

  // Action styling
  const getActionStyle = () => {
    switch(item.action) {
      case "Deleted": 
        return "bg-red-100 text-red-800";
      case "Updated":
        return "bg-yellow-100 text-yellow-800";
      case "Created":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionIcon = () => {
    switch(item.action) {
      case "Deleted": return <Trash2 size={16} />;
      case "Updated": return <RefreshCw size={16} />;
      case "Created": return <Plus size={16} />;
      default: return <FileDiff size={16} />;
    }
  };

  const canShowPrev = !!item.previousData && (item.action === "Updated" || item.action === "Deleted");

  const handleShowPrev = async () => {
    let endpoint = "";
    if (item.entityType === "Driver") endpoint = `/api/drivers/${item.entityId}`;
    else if (item.entityType === "Vehicle") endpoint = `/api/vehicles/${item.entityId}`;
    if (!endpoint) return;
    const res = await fetch(endpoint);
    const data = await res.json();
    setCurrentData(data.driver || data.vehicle || {});
    setPrevOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden">
          {/* Modal Header */}
          <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileDiff size={20} />
              <h2 className="text-lg font-semibold">Change History</h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-white hover:text-orange-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {/* Action Info */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 ${getActionStyle()}`}>
              {getActionIcon()}
              <span className="font-medium">{item.action} by {item.performedBy}</span>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-2 text-gray-600 mb-6">
              <Clock size={16} />
              <span>{new Date(item.timestamp).toLocaleString()}</span>
            </div>

           {/* Previous Data Preview */}
<div className="mb-6 flex flex-col" style={{ minHeight: '200px', maxHeight: '400px' }}>
  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-1">
    <ChevronRight size={16} />
    Previous Version Snapshot
  </h3>
  
  <div className="border border-gray-200 rounded-lg overflow-hidden flex-1 flex flex-col">
    <div className="overflow-auto flex-1">
      <table className="w-full min-w-max">
        <thead className="sticky top-0">
          <tr className="bg-orange-50 text-orange-800">
            <th className="px-4 py-3 text-left font-medium min-w-[150px]">Field</th>
            <th className="px-4 py-3 text-left font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(prevData).length === 0 ? (
            <tr>
              <td 
                colSpan={2} 
                className="text-center p-4 text-gray-400 h-full flex items-center justify-center"
                style={{ height: '150px' }}
              >
                No previous data available
              </td>
            </tr>
          ) : (
            Object.entries(prevData).map(([k, v]) => (
              <tr key={k} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap align-top">{k}</td>
                <td className="px-4 py-3 text-gray-600 break-words max-w-[300px] align-top">
                  <div className="max-h-20 overflow-y-auto">
                    {String(v)}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>

            {/* Compare Button */}
            {canShowPrev && (
              <button
                onClick={handleShowPrev}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FileDiff size={16} />
                Compare With Current Version
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Previous Data Modal */}
      {prevOpen && currentData && (
        <PreviousDataModal
          prevData={prevData}
          currentData={currentData}
          onClose={() => setPrevOpen(false)}
          title="Full Field Comparison"
          action={item.action}
          timestamp={item.timestamp}
        />
      )}
    </>
  );
};

export default HistoryModal;