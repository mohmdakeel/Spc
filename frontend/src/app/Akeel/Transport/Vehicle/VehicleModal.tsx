import React from "react";
import { Vehicle } from "./types";
import StatusBadge from "./StatusBadge";

export default function VehicleModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow p-6 w-[380px]">
        <h2 className="font-bold text-lg mb-3">Vehicle Details</h2>
        <div className="space-y-2 text-sm">
          <div><b>ID:</b> {vehicle.id}</div>
          <div><b>Number:</b> {vehicle.vehicleNumber}</div>
          <div><b>Type:</b> {vehicle.vehicleType ?? "-"}</div>
          <div><b>Brand:</b> {vehicle.brand ?? "-"}</div>
          <div><b>Model:</b> {vehicle.model ?? "-"}</div>
          <div><b>Chassis:</b> {vehicle.chassisNumber ?? "-"}</div>
          <div><b>Engine:</b> {vehicle.engineNumber ?? "-"}</div>
          <div><b>Manufacture Date:</b> {vehicle.manufactureDate ? new Date(vehicle.manufactureDate).toLocaleDateString() : "-"}</div>
          <div><b>Total KM:</b> {vehicle.totalKmDriven ?? "-"}</div>
          <div><b>Fuel Efficiency:</b> {vehicle.fuelEfficiency ?? "-"}</div>
          <div><b>Condition:</b> {vehicle.presentCondition ?? "-"}</div>
          <div className="flex items-center gap-2"><b>Status:</b> <StatusBadge status={vehicle.status} /></div>
        </div>
        <button className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700 mt-4" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
