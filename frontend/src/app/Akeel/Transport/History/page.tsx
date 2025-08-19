"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  fetchAllHistory,
  fetchHistoryByEntity,
  HistoryItem,
} from "../services/historyService";
import HistoryModal from "./HistoryModal";
import { Clock, User, RefreshCw, Trash2, Plus, FileText, ChevronRight } from "lucide-react";

export default function HistoryPage() {
  const params = useSearchParams();
  const router = useRouter();
  const entityType = params.get("entityType");
  const entityId = params.get("entityId");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        if (entityType && entityId) {
          const data = await fetchHistoryByEntity(entityType, entityId);
          if (mounted) setHistory(data);
        } else {
          const data = await fetchAllHistory();
          if (mounted) setHistory(data);
        }
      } catch (e) {
        setHistory([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [entityType, entityId]);

  const getActionStyle = (action: string) => {
    switch(action) {
      case "Deleted": return "bg-red-100 text-red-800";
      case "Updated": return "bg-yellow-100 text-yellow-800";
      case "Created": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActionIcon = (action: string) => {
    switch(action) {
      case "Deleted": return <Trash2 size={16} />;
      case "Updated": return <RefreshCw size={16} />;
      case "Created": return <Plus size={16} />;
      default: return <FileText size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 text-center text-gray-600">
        Loading history records...
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-orange-50 rounded-lg text-orange-800 text-center">
        No history records found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-orange-600" size={20} />
          {entityType && entityId
            ? `History for ${entityType} #${entityId}`
            : "All History Logs"}
        </h1>
        {entityType && entityId && (
          <button
            onClick={() => router.push('/Akeel/Transport/History')}
            className="text-orange-600 hover:text-orange-800 text-sm flex items-center gap-1"
          >
            View All History
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-orange-50 text-orange-800">
              <th className="p-3 text-left font-medium">Entity</th>
              <th className="p-3 text-left font-medium">Action</th>
              <th className="p-3 text-left font-medium">Time</th>
              <th className="p-3 text-left font-medium">User</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr
                key={item.id}
                className="border-t hover:bg-orange-50 cursor-pointer transition-colors"
                onClick={() => setSelected(item)}
              >
                <td className="p-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/Akeel/Transport/History?entityType=${item.entityType}&entityId=${item.entityId}`
                      );
                    }}
                    className="text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1"
                  >
                    {item.entityType}
                    <ChevronRight size={16} />
                  </button>
                  <div className="text-xs text-gray-500 mt-1">ID: {item.entityId}</div>
                </td>
                <td className="p-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm w-fit ${getActionStyle(item.action)}`}>
                    {getActionIcon(item.action)}
                    {item.action}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} />
                    {new Date(Number(item.timestamp)).toLocaleString()}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={14} />
                    {item.performedBy}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <HistoryModal item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}