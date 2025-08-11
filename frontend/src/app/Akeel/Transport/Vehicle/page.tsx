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
import {
  Printer,
  History as HistoryIcon,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 15;

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString() : "-");
const fmt = (v: any) => (v === null || v === undefined || v === "" ? "-" : v);

export default function VehicleListPage() {
  // data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [deletedVehicles, setDeletedVehicles] = useState<Vehicle[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);

  // ui state
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // modals
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [showView, setShowView] = useState(false);
  const [showForm, setShowForm] = useState<false | "add" | "edit">(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [history, setHistory] = useState<VehicleHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  // load data
  const load = async () => {
    try {
      const [active, deleted] = await Promise.all([fetchVehicles(), fetchDeletedVehicles()]);
      setVehicles(active ?? []);
      setDeletedVehicles(deleted ?? []);
    } catch (e: any) {
      console.error(e);
      alert(`Failed to load vehicles: ${e?.response?.data?.message || e?.message || e}`);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filter + paginate
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
        v.presentCondition,
        v.status,
        v.totalKmDriven,
        v.fuelEfficiency,
      ]
        .map((x) => (x ?? "").toString())
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [list, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageRows = filtered.slice(start, start + ITEMS_PER_PAGE);

  useEffect(() => setCurrentPage(1), [showDeleted, search]);

  // actions
  const onAddSubmit = async (data: Partial<Vehicle>) => {
    try {
      await addVehicle(data);
      setShowForm(false);
      await load();
    } catch (e: any) {
      console.error(e);
      alert(`Add failed: ${e?.response?.data?.message || e?.message || e}`);
    }
  };

  const onEditSubmit = async (data: Partial<Vehicle>) => {
    if (!editing || editing.id == null) return;
    try {
      await updateVehicle(editing.id, data);
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      console.error(e);
      alert(`Update failed: ${e?.response?.data?.message || e?.message || e}`);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget || deleteTarget.id == null) return;
    try {
      await deleteVehicle(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      console.error(e);
      alert(`Delete failed: ${e?.response?.data?.message || e?.message || e}`);
    }
  };

  const onChangeStatus = async (v: Vehicle, status: VehicleStatus) => {
    if (v.id == null) return;
    try {
      await changeVehicleStatus(v.id, status);
      await load();
    } catch (e: any) {
      console.error(e);
      alert(`Status change failed: ${e?.response?.data?.message || e?.message || e}`);
    }
  };

  const openView = async (v: Vehicle) => {
    if (v.id == null) return;
    try {
      const full = await fetchVehicleById(v.id);
      setSelected(full);
      setShowView(true);
    } catch (e: any) {
      console.error(e);
      alert(`Load vehicle failed: ${e?.response?.data?.message || e?.message || e}`);
    }
  };

  const onOpenHistory = async (v: Vehicle) => {
    if (v.id == null) return;
    try {
      const his = await fetchVehicleHistory(v.id);
      setHistory(his ?? []);
      setShowHistory(true);
    } catch (e: any) {
      console.error(e);
      alert(`Load history failed: ${e?.response?.data?.message || e?.message || e}`);
    }
  };

  // print (list)
  const printAll = () => {
    const w = window.open("", "", "width=1100,height=700");
    if (!w) return;
    w.document.write(`<!doctype html>
<html>
  <head>
    <title>Vehicles</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h2 { color:#ea580c; text-align:center; }
      table { width:100%; border-collapse:collapse; margin-top:12px; font-size:12px; }
      th, td { border-bottom:1px solid #eee; text-align:left; padding:6px; }
      thead th { background:#ffedd5; color:#9a3412; position:sticky; top:0; }
      .num { text-align:right; }
    </style>
  </head>
  <body>
    <h2>${showDeleted ? "Deleted" : "Active"} Vehicles (${filtered.length})</h2>
    <div>Printed on: ${new Date().toLocaleString()}</div>
    <table>
      <thead>
        <tr>
          <th>ID</th><th>Number</th><th>Type</th><th>Brand</th><th>Model</th>
          <th>Chassis</th><th>Engine</th><th>Mfg Date</th><th class="num">Total KM</th>
          <th class="num">Fuel Eff.</th><th>Condition</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(v => `
          <tr>
            <td>${fmt(v.id)}</td>
            <td>${fmt(v.vehicleNumber)}</td>
            <td>${fmt(v.vehicleType)}</td>
            <td>${fmt(v.brand)}</td>
            <td>${fmt(v.model)}</td>
            <td>${fmt(v.chassisNumber)}</td>
            <td>${fmt(v.engineNumber)}</td>
            <td>${fmtDate(v.manufactureDate)}</td>
            <td class="num">${fmt(v.totalKmDriven)}</td>
            <td class="num">${fmt(v.fuelEfficiency)}</td>
            <td>${fmt(v.presentCondition)}</td>
            <td>${fmt(v.status)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  </body>
</html>`);
    w.document.close();
    setTimeout(() => {
      w.print();
      w.close();
    }, 150);
  };

  // render
  return (
    <div className="flex min-h-screen bg-orange-50">
      <div className="flex-1 p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Vehicle Management</h1>
              <p className="text-sm text-orange-600">
                {filtered.length} {showDeleted ? "deleted" : "active"} vehicles
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg overflow-hidden border border-orange-300">
                <button
                  className={`px-4 py-2 text-sm md:text-base ${
                    !showDeleted ? "bg-orange-600 text-white" : "bg-white text-orange-600 hover:bg-orange-50"
                  }`}
                  onClick={() => setShowDeleted(false)}
                >
                  Active{" "}
                  <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                    {vehicles.length}
                  </span>
                </button>
                <button
                  className={`px-4 py-2 text-sm md:text-base ${
                    showDeleted ? "bg-red-600 text-white" : "bg-white text-red-600 hover:bg-red-50"
                  }`}
                  onClick={() => setShowDeleted(true)}
                >
                  Deleted{" "}
                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                    {deletedVehicles.length}
                  </span>
                </button>
              </div>

              <button
                className="flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow"
                onClick={() => {
                  setEditing(null);
                  setShowForm("add");
                }}
              >
                <Plus size={18} />
                <span>Add Vehicle</span>
              </button>

              <button
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow"
                onClick={printAll}
              >
                <Printer size={18} />
                <span>Print All</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <input
            className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="Search any field (number, type, brand, chassis, engine, status, etc.)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* MOBILE: cards (row click opens view) */}
          <div className="grid gap-3 md:hidden">
            {pageRows.map((v, i) => (
              <div
                key={v.id ?? `${v.vehicleNumber}-${i}`}
                className="rounded-lg border border-orange-100 p-4 cursor-pointer hover:bg-orange-50"
                onClick={() => openView(v)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{v.vehicleNumber}</div>
                  <StatusBadge status={v.status} />
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><b>Type:</b> {fmt(v.vehicleType)}</div>
                  <div><b>Brand:</b> {fmt(v.brand)} • <b>Model:</b> {fmt(v.model)}</div>
                  <div><b>Chassis:</b> {fmt(v.chassisNumber)}</div>
                  <div><b>Engine:</b> {fmt(v.engineNumber)}</div>
                  <div><b>Mfg:</b> {fmtDate(v.manufactureDate)} • <b>KM:</b> {fmt(v.totalKmDriven)}</div>
                  <div><b>Fuel:</b> {fmt(v.fuelEfficiency)} • <b>Cond.:</b> {fmt(v.presentCondition)}</div>
                </div>
                <div className="flex gap-2 mt-3">
                  {!showDeleted && (
                    <>
                      <button
                        className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg"
                        onClick={(e) => { e.stopPropagation(); onOpenHistory(v); }}
                        title="History"
                      >
                        <HistoryIcon size={18} />
                      </button>
                      <button
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                        onClick={(e) => { e.stopPropagation(); setEditing(v); setShowForm("edit"); }}
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(v); }}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP/TABLET: aligned sticky table (row click opens view) */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-orange-100">
            <table className="w-full text-sm min-w-[1200px]">
              <thead className="bg-orange-50 sticky top-0 z-10">
                <tr>
                  <Th className="w-12">#</Th>
                  <Th className="w-40">Number</Th>
                  <Th className="w-32">Type</Th>
                  <Th className="w-32">Brand</Th>
                  <Th className="w-32">Model</Th>
                  <Th className="w-40">Chassis</Th>
                  <Th className="w-40">Engine</Th>
                  <Th className="w-32">Mfg Date</Th>
                  <Th className="w-28 text-right">Total KM</Th>
                  <Th className="w-28 text-right">Fuel Eff.</Th>
                  <Th className="w-40">Condition</Th>
                  <Th className="w-48">Status</Th>
                   <Th className="w-48"> Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {pageRows.map((v, i) => (
                  <tr
                    key={v.id ?? `${v.vehicleNumber}-${i}`}
                    className="hover:bg-orange-50 cursor-pointer"
                    onClick={() => openView(v)}
                  >
                    <Td>{start + i + 1}</Td>
                    <Td className="font-medium">{fmt(v.vehicleNumber)}</Td>
                    <Td>{fmt(v.vehicleType)}</Td>
                    <Td>{fmt(v.brand)}</Td>
                    <Td>{fmt(v.model)}</Td>
                    <Td className="whitespace-nowrap">{fmt(v.chassisNumber)}</Td>
                    <Td className="whitespace-nowrap">{fmt(v.engineNumber)}</Td>
                    <Td className="whitespace-nowrap">{fmtDate(v.manufactureDate)}</Td>
                    <Td className="text-right">{fmt(v.totalKmDriven)}</Td>
                    <Td className="text-right">{fmt(v.fuelEfficiency)}</Td>
                    <Td>{fmt(v.presentCondition)}</Td>
                    <Td>
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()} // don’t trigger row view when using controls
                      >
                        <StatusBadge status={v.status} />
                        {!showDeleted && (
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            value={(v.status ?? "INACTIVE") as VehicleStatus}
                            onChange={(e) => onChangeStatus(v, e.target.value as VehicleStatus)}
                          >
                            {["ACTIVE", "INACTIVE", "MAINTENANCE", "REMOVED"].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}

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
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pageRows.length === 0 && (
              <div className="text-center py-12 text-gray-500">No {showDeleted ? "deleted" : "active"} vehicles found.</div>
            )}
          </div>

          {/* Pagination */}
          {filtered.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 p-4 border-t border-orange-100 mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
                  currentPage === 1 ? "bg-gray-100 text-gray-400" : "bg-orange-600 text-white hover:bg-orange-700"
                }`}
              >
                <ChevronLeft size={18} /> Previous
              </button>

              <div className="text-sm text-gray-600 text-center">
                Page <span className="font-medium">{currentPage}</span> of{" "}
                <span className="font-medium">{totalPages}</span> • Showing{" "}
                <span className="font-medium">
                  {start + 1}-{Math.min(start + ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                of <span className="font-medium">{filtered.length}</span>
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
                  currentPage === totalPages ? "bg-gray-100 text-gray-400" : "bg-orange-600 text-white hover:bg-orange-700"
                }`}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showView && selected && <VehicleModal vehicle={selected} onClose={() => setShowView(false)} />}

      {showForm && (
        <VehicleForm
          vehicle={showForm === "edit" ? editing ?? undefined : undefined}
          onSubmit={showForm === "edit" ? onEditSubmit : onAddSubmit}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {showHistory && <VehicleHistoryModal history={history} onClose={() => setShowHistory(false)} />}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow p-6 w-[420px]">
            <h3 className="text-lg font-bold mb-2">Delete Vehicle</h3>
            <p className="text-sm text-gray-600">Delete {deleteTarget.vehicleNumber}?</p>
            <div className="flex justify-end gap-2 mt-5">
              <button className="px-4 py-2 rounded bg-gray-200 text-gray-800" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700" onClick={onDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** small helpers to keep th/td alignment consistent */
function Th({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <th className={`p-3 text-left text-orange-800 font-medium whitespace-nowrap ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`p-3 align-middle ${className}`}>{children}</td>;
}
