import React, { useEffect, useState } from "react";
import { Vehicle, VehicleStatus } from "./types";

interface Props {
  vehicle?: Vehicle;
  onSubmit: (v: Partial<Vehicle>) => void;
  onClose: () => void;
}

const STATUSES: VehicleStatus[] = ["ACTIVE", "INACTIVE", "MAINTENANCE", "REMOVED"];

export default function VehicleForm({ vehicle, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<Partial<Vehicle>>({ status: "ACTIVE" });

  useEffect(() => {
    if (vehicle) {
      setForm({
        ...vehicle,
        // make sure date field is yyyy-mm-dd for the input
        manufactureDate: vehicle.manufactureDate ? vehicle.manufactureDate : undefined,
      });
    }
  }, [vehicle]);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newVal: any = value;
    if (type === "number") newVal = value === "" ? undefined : Number(value);
    setForm((f) => ({ ...f, [name]: newVal }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleNumber || !form.vehicleNumber.trim()) {
      alert("Vehicle Number is required");
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 w-[420px]">
        <h2 className="text-xl font-bold mb-4">{vehicle ? "Edit Vehicle" : "Add Vehicle"}</h2>

        <div className="space-y-2">
          <input className="input border rounded px-3 py-2 w-full"
                 name="vehicleNumber" placeholder="Vehicle Number"
                 value={form.vehicleNumber ?? ""} onChange={change} required />
          <input className="input border rounded px-3 py-2 w-full"
                 name="vehicleType" placeholder="Type"
                 value={form.vehicleType ?? ""} onChange={change} />
          <input className="input border rounded px-3 py-2 w-full"
                 name="brand" placeholder="Brand"
                 value={form.brand ?? ""} onChange={change} />
          <input className="input border rounded px-3 py-2 w-full"
                 name="model" placeholder="Model"
                 value={form.model ?? ""} onChange={change} />
          <input className="input border rounded px-3 py-2 w-full"
                 name="chassisNumber" placeholder="Chassis Number"
                 value={form.chassisNumber ?? ""} onChange={change} />
          <input className="input border rounded px-3 py-2 w-full"
                 name="engineNumber" placeholder="Engine Number"
                 value={form.engineNumber ?? ""} onChange={change} />
          <input className="input border rounded px-3 py-2 w-full"
                 type="date" name="manufactureDate" placeholder="Manufacture Date"
                 value={form.manufactureDate ? form.manufactureDate.slice(0, 10) : ""} onChange={change} />
          <input className="input border rounded px-3 py-2 w-full"
                 type="number" name="totalKmDriven" placeholder="Total KM Driven"
                 value={form.totalKmDriven ?? ""} onChange={change} />
          <input className="input border rounded px-3 py-2 w-full"
                 type="number" step="0.01" name="fuelEfficiency" placeholder="Fuel Efficiency"
                 value={form.fuelEfficiency ?? ""} onChange={change} />
          <input className="input border rounded px-3 py-2 w-full"
                 name="presentCondition" placeholder="Condition"
                 value={form.presentCondition ?? ""} onChange={change} />
          <select className="input border rounded px-3 py-2 w-full"
                  name="status" value={form.status ?? "ACTIVE"} onChange={change}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700" type="submit">
            {vehicle ? "Update" : "Add"}
          </button>
          <button className="px-4 py-2 rounded bg-gray-200 text-gray-800" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
