"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchVehicles,
  fetchDeletedVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  changeVehicleStatus,
  fetchVehicleHistory,
  fetchVehicleById,
} from "./VehicleService";
import { Vehicle, VehicleHistory, VehicleStatus } from "./types";
import StatusBadge from "./StatusBadge";
import VehicleModal from "./VehicleModal";
import VehicleForm from "./VehicleForm";
import VehicleHistoryModal from "./VehicleHistoryModal";
import SearchBar from "./SearchBar";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { Printer, History as HistoryIcon, Edit, Trash2, Plus, Eye, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 15;

export default function VehicleListPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [deletedVehicles, setDeletedVehicles] = useState<Vehicle[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [showView, setShowView] = useState(false);

  const [showForm, setShowForm] = useState<false | "add" | "edit">(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const [history, setHistory] = useState<VehicleHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const load = async () => {
    const [active, deleted] = await Promise.all([fetchVehicles(), fetchDeletedVehicles()]);
    setVehicles(active);
    setDeletedVehicles(deleted);
  };

  useEffect(() => {
    load();
  }, []);

  // Filter
  const list = showDeleted ? deletedVehicles : vehicles;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((v) =>
      [
        v.id,
        v.vehicleNumber,
        v.vehicleType,
        v.brand,
        v.model,
        v.chassisNumber,
        v.engineNumber,
        v.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [list, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageRows = filtered.slice(start, start + ITEMS_PER_PAGE);

  useEffect(() => {
    // reset to page 1 when tab or search changes
    setCurrentPage(1);
  }, [showDeleted, search]);

  const onAddSubmit = async (data: Partial<Vehicle>) => {
    await addVehicle(data);
    setShowForm(false);
    await load();
  };

  const onEditSubmit = async (data: Partial<Vehicle>) => {
    if (!editing) return;
    await updateVehicle(editing.id, data);
    setShowForm(false);
    setEditing(null);
    await load();
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    await deleteVehicle(deleteTarget.id);
    setDeleteTarget(null);
    await load();
  };

  const onChangeStatus = async (v: Vehicle, status: VehicleStatus) => {
    await changeVehicleStatus(v.id, status);
    await load();
  };

  const onOpenView = async (v: Vehicle) => {
    // fetch latest snapshot (includes previousData via dedicated endpoint if you add it later)
    const full = await fetchVehicleById(v.id);
    setSelected(full);
    setShowView(true);
  };

  const onOpenHistory = async (v: Vehicle) => {
    const his = await fetchVehicleHistory(v.id);
    setHistory(his);
    setShowHistory(true);
  };

  const printOne = (v: Vehicle) => {
    const w = window.open("", "", "width=800,height=600");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Vehicle - ${v.vehicleNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px; }
            .row { margin: 6px 0; }
            .label { display:inline-block; min-width:160px; color:#6b7280; font-weight:bold; }
          </style>
        </head>
        <body>
          <h1>Vehicle Details</h1>
          <div class="row"><span class="label">ID:</span> ${v.id}</div>
          <div class="row"><span class="label">Number:</span> ${v.vehicleNumber}</div>
          <div class="row"><span class="label">Type:</span> ${v.vehicleType ?? "-"}</div>
          <div class="row"><span class="label">Brand:</span> ${v.brand ?? "-"}</div>
          <div class="row"><span class="label">Model:</span> ${v.model ?? "-"}</div>
          <div class="row"><span class="label">Chassis:</span> ${v.chassisNumber ?? "-"}</div>
          <div class="row"><span class="label">Engine:</span> ${v.engineNumber ?? "-"}</div>
          <div class="row"><span class="label">Manufacture Date:</span> ${v.manufactureDate ? new Date(v.manufactureDate).toLocaleDateString() : "-"}</div>
          <div class="row"><span class="label">Total KM:</span> ${v.totalKmDriven ?? "-"}</div>
          <div class="row"><span class="label">Fuel Efficiency:</span> ${v.fuelEfficiency ?? "-"}</div>
          <div class="row"><span class="label">Condition:</span> ${v.presentCondition ?? "-"}</div>
          <div class="row"><span class="label">Status:</span> ${v.status ?? "-"}</div>
          <div class="row"><span class="label">Printed On:</span> ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `);
    w.document.close();
    setTimeout(() => {
      w.print();
      w.close();
    }, 200);
  };

  const printAll = () => {
    const rows = filtered
      .map(
        (v) => `
        <tr>
          <td>${v.id}</td>
          <td>${v.vehicleNumber}</td>
          <td>${v.vehicleType ?? "-"}</td>
          <td>${v.brand ?? "-"}</td>
          <td>${v.model ?? "-"}</td>
          <td>${v.status ?? "-"}</td>
        </tr>`
      )
      .join("");
    const w = window.open("", "", "width=900,height=600");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>${showDeleted ? "Deleted Vehicles" : "Active Vehicles"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color:#ea580c; text-align:center; }
            table { width:100%; border-collapse:collapse; margin-top:12px; }
            th, td { border-bottom:1px solid #eee; text-align:left; padding:8px; }
            thead th { background:#ffedd5; color:#9a3412; }
          </style>
        </head>
        <body>
          <h1>${showDeleted ? "Deleted Vehicles Report" : "Active Vehicles Report"}</h1>
          <div>Printed on: ${new Date().toLocaleString()}</div>
          <div>Total records: ${filtered.length}</div>
          <table>
            <thead>
              <tr><th>ID</th><th>Number</th><th>Type</th><th>Brand</th><th>Model</th><th>Status</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    w.document.close();
    setTimeout(() => {
      w.print();
      w.close();
    }, 200);
  };

  return (
    <div className="flex h-screen bg-orange-50">
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white rounded-xl shadow-md p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Vehicle Management</h1>
              <p className="text-sm text-orange-600">
                {filtered.length} {showDeleted ? "deleted" : "active"} vehicles
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              <div className="flex rounded-lg overflow-hidden border border-orange-300 shadow-sm">
                <button
                  className={`px-4 py-2 ${!showDeleted ? "bg-orange-600 text-white" : "bg-white text-orange-600 hover:bg-orange-50"}`}
                  onClick={() => setShowDeleted(false)}
                >
                  Active <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">{vehicles.length}</span>
                </button>
                <button
                  className={`px-4 py-2 ${showDeleted ? "bg-red-600 text-white" : "bg-white text-red-600 hover:bg-red-50"}`}
                  onClick={() => setShowDeleted(true)}
                >
                  Deleted <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">{deletedVehicles.length}</span>
                </button>
              </div>
              <button
                className="flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-md"
                onClick={() => { setEditing(null); setShowForm("add"); }}
              >
                <Plus size={18} /> <span>Add Vehicle</span>
              </button>
              <button
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                onClick={printAll}
              >
                <Printer size={18} /> <span>Print All</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by number, brand, model…" />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-orange-100">
            <table className="w-full text-sm">
              <thead className="bg-orange-50">
                <tr>
                  <th className="p-3 text-left text-orange-800">#</th>
                  <th className="p-3 text-left text-orange-800">Number</th>
                  <th className="p-3 text-left text-orange-800">Type</th>
                  <th className="p-3 text-left text-orange-800">Brand</th>
                  <th className="p-3 text-left text-orange-800">Model</th>
                  <th className="p-3 text-left text-orange-800">Status</th>
                  <th className="p-3 text-left text-orange-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {pageRows.map((v, i) => (
                  <tr key={v.id} className="hover:bg-orange-50">
                    <td className="p-3">{start + i + 1}</td>
                    <td className="p-3">{v.vehicleNumber}</td>
                    <td className="p-3">{v.vehicleType ?? "-"}</td>
                    <td className="p-3">{v.brand ?? "-"}</td>
                    <td className="p-3">{v.model ?? "-"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={v.status} />
                        {!showDeleted && (
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            value={v.status ?? "INACTIVE"}
                            onChange={(e) => onChangeStatus(v, e.target.value as VehicleStatus)}
                          >
                            {["ACTIVE", "INACTIVE", "MAINTENANCE", "REMOVED"].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          onClick={() => printOne(v)}
                          title="Print"
                        >
                          <Printer size={18} />
                        </button>
                        {!showDeleted && (
                          <>
                            <button
                              className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                              onClick={() => onOpenHistory(v)}
                              title="History"
                            >
                              <HistoryIcon size={18} />
                            </button>
                            <button
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              onClick={() => { setEditing(v); setShowForm("edit"); }}
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              onClick={() => setDeleteTarget(v)}
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        <button
                          className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={() => onOpenView(v)}
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pageRows.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No {showDeleted ? "deleted" : "active"} vehicles found.
              </div>
            )}

            {/* Pagination */}
            {filtered.length > ITEMS_PER_PAGE && (
              <div className="flex justify-between items-center p-4 border-t border-orange-100">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentPage === 1 ? "bg-gray-100 text-gray-400" : "bg-orange-600 text-white hover:bg-orange-700"}`}
                >
                  <ChevronLeft size={18} /> Previous
                </button>
                <div className="text-sm text-gray-600">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span> • Showing{" "}
                  <span className="font-medium">{start + 1}-{Math.min(start + ITEMS_PER_PAGE, filtered.length)}</span> of{" "}
                  <span className="font-medium">{filtered.length}</span>
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentPage === totalPages ? "bg-gray-100 text-gray-400" : "bg-orange-600 text-white hover:bg-orange-700"}`}
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showView && selected && (
        <VehicleModal vehicle={selected} onClose={() => setShowView(false)} />
      )}

      {showForm && (
        <VehicleForm
          vehicle={showForm === "edit" ? editing ?? undefined : undefined}
          onSubmit={showForm === "edit" ? onEditSubmit : onAddSubmit}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {showHistory && (
        <VehicleHistoryModal history={history} onClose={() => setShowHistory(false)} />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Vehicle"
          message={`Are you sure you want to delete vehicle ${deleteTarget.vehicleNumber}?`}
          onConfirm={onDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
