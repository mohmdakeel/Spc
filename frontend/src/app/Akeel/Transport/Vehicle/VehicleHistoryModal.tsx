import React from "react";
import { VehicleHistory } from "./types";

export default function VehicleHistoryModal({ history, onClose }: { history: VehicleHistory[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow p-6 w-[700px] max-h-[80vh] overflow-auto">
        <h2 className="font-bold text-lg mb-4">Vehicle History</h2>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Action</th>
              <th className="text-left p-2">By</th>
              <th className="text-left p-2">When</th>
              <th className="text-left p-2">Previous Data</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {history.map((h) => {
              let pretty = "-";
              if (h.previousData) {
                try {
                  const obj = JSON.parse(h.previousData);
                  pretty = JSON.stringify(obj, null, 2);
                } catch {
                  pretty = h.previousData;
                }
              }
              return (
                <tr key={h.id}>
                  <td className="p-2">{h.action}</td>
                  <td className="p-2">{h.performedBy}</td>
                  <td className="p-2">{new Date(h.timestamp).toLocaleString()}</td>
                  <td className="p-2">
                    <pre className="max-w-[360px] whitespace-pre-wrap break-words">{pretty}</pre>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700 mt-4" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
