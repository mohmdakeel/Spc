'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Printer, History as HistoryIcon, Edit, Trash2, Plus, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

import VehicleForm from './VehicleForm';
import {
  fetchVehicles,
  fetchDeletedVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  fetchVehicleById,
  createVehicleWithImages,
} from '../services/VehicleService';
import VehicleImagesHero from '../Vehicle/VehicleImagesHero';
import { printVehicle, printVehicleList } from '../utils/print';
import SearchBar from '../components/SearchBar';
import StatusPill from '../components/StatusPill';
import EntityModal from '../components/EntityModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { Th, Td } from '../components/ThTd';
import type { Vehicle, VehicleStatus } from '../services/types';
import { useAuth } from '../../../../../hooks/useAuth';

/* one-view switch */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setMatches((e as MediaQueryList).matches ?? (e as MediaQueryListEvent).matches);
    setMatches(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', handler as any);
    else mql.addListener(handler as any);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler as any);
      else mql.removeListener(handler as any);
    };
  }, [query]);
  return matches;
}

const ITEMS_PER_PAGE = 10;
const ROW_TEXT = 'text-xs';
const ROW_PX = 'px-2';
const ROW_PY = 'py-1.5';
const HEAD_TEXT = 'text-xs font-semibold text-orange-800';
const HEAD_PY = 'py-2';

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString() : '-');
const fmtDateTime = (s?: string | Date | null) => (s ? new Date(s as any).toLocaleString() : '-');
const fmt = (v: unknown) => (v == null || v === '' ? '-' : String(v));
const odoText = (v: Vehicle, multiline = false) => {
  const reg = v.registeredKm ?? v.totalKmDriven;
  const cur = v.totalKmDriven;
  if (multiline) {
    return (
      <div className="leading-tight text-[11px] text-gray-800">
        <div className="font-medium">Reg: {reg ?? '—'}</div>
        <div className="font-semibold text-orange-900">Current: {cur ?? '—'}</div>
      </div>
    );
  }
  if (reg != null && cur != null) {
    return reg === cur ? String(cur) : `${reg} / ${cur}`;
  }
  if (reg != null) return String(reg);
  if (cur != null) return String(cur);
  return '—';
};

export default function VehicleListPage() {
  const router = useRouter();
  const isMdUp = useMediaQuery('(min-width: 768px)');
  const { user } = useAuth();

  const roles = (user?.roles || []).map(r => r.toUpperCase());
  const perms = (user?.permissions || []).map(p => p.toUpperCase());
  const isAdmin = roles.some(r => ['ADMIN', 'TRANSPORT_ADMIN'].includes(r));
  const canCreate = isAdmin || perms.includes('CREATE');
  const canUpdate = isAdmin || perms.includes('UPDATE');
  const canDelete = isAdmin || perms.includes('DELETE');
  const canPrint  = isAdmin || perms.includes('PRINT') || perms.includes('READ');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [deletedVehicles, setDeletedVehicles] = useState<Vehicle[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [showView, setShowView] = useState(false);
  const [showForm, setShowForm] = useState<false | 'add' | 'edit'>(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const [active, deleted] = await Promise.all([fetchVehicles(), fetchDeletedVehicles()]);
      setVehicles(Array.isArray(active) ? active : []);
      setDeletedVehicles(Array.isArray(deleted) ? deleted : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load vehicles');
      setVehicles([]);
      setDeletedVehicles([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const list = showDeleted ? deletedVehicles : vehicles;

  const filtered = useMemo(() => {
    const data = Array.isArray(list) ? list : [];
    const q = search.trim().toLowerCase();
    const statusFiltered = statusFilter === 'ALL'
      ? data
      : data.filter(v => (v.status || 'AVAILABLE').toUpperCase() === statusFilter.toUpperCase());

    if (!q) return statusFiltered;
    return statusFiltered.filter((v) =>
      [
        v.vehicleNumber, v.vehicleType, v.brand, v.model, v.chassisNumber, v.engineNumber,
        v.manufactureDate, v.registeredKm, v.totalKmDriven, v.fuelEfficiency, v.presentCondition, v.status,
      ].map((x) => (x ?? '').toString().toLowerCase()).join(' ').includes(q)
    );
  }, [list, search, statusFilter]);

  useEffect(() => { setPage(1); }, [showDeleted, search]);

  const totalPages = Math.max(1, Math.ceil((filtered?.length ?? 0) / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE;
  const rows = (filtered ?? []).slice(start, start + ITEMS_PER_PAGE);
  const goTo = (p: number) => setPage(Math.min(totalPages, Math.max(1, p)));

  const PaginationBar = () => {
    const first = 1;
    const last = totalPages;
    const startWin = Math.max(first, page - 2);
    const endWin = Math.min(last, startWin + 4);
    const nums = Array.from({ length: endWin - startWin + 1 }, (_, i) => startWin + i);
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-100 mt-3">
        <span className="text-xs text-orange-800">
          Showing {filtered.length ? start + 1 : 0}–{Math.min(start + ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 1}
            className={`p-1 rounded ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-orange-600 hover:bg-orange-100'}`}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          {nums.map(n => (
            <button
              key={n}
              onClick={() => goTo(n)}
              className={`px-2 py-1 rounded text-xs ${page === n ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-100'}`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages}
            className={`p-1 rounded ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-orange-600 hover:bg-orange-100'}`}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  const onAddSubmit = async (payload: Partial<Vehicle>, files?: File[] | FileList) => {
    if (!canCreate) { toast.error('You do not have permission to add vehicles.'); return; }
    try {
      const hasFiles = !!files && (Array.isArray(files) ? files.length > 0 : files.length > 0);
      if (hasFiles) await createVehicleWithImages(payload, files as any);
      else await addVehicle(payload);
      toast.success('Vehicle added successfully');
      setShowForm(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add vehicle');
    }
  };

  const onEditSubmit = async (payload: Partial<Vehicle>) => {
    if (!canUpdate) { toast.error('You do not have permission to update vehicles.'); return; }
    try {
      if (!editing || editing.id == null) throw new Error('No vehicle selected for editing');
      await updateVehicle(editing.id, payload);
      toast.success('Vehicle updated successfully');
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update vehicle');
    }
  };

  const onDelete = async () => {
    if (!canDelete) { toast.error('You do not have permission to delete vehicles.'); return; }
    if (!deleteTarget || deleteTarget.id == null) return;
    try {
      await deleteVehicle(deleteTarget.id);
      toast.success('Vehicle deleted successfully');
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete vehicle');
    }
  };

  const onChangeStatus = async (v: Vehicle, status: VehicleStatus) => {
    try {
      if (v.id == null) { toast.error('Invalid vehicle id'); return; }
      await updateVehicle(v.id, { status: status || 'AVAILABLE' });
      toast.success('Status updated');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to change status');
    }
  };

  const openView = async (v: Vehicle) => {
    setSelected(v);
    setShowView(true);
    if (v.id == null) return;
    try {
      const full = await fetchVehicleById(v.id);
      if (full) setSelected(full);
    } catch {}
  };

  const onOpenHistory = (v: Vehicle) => {
    if (v.id == null) return;
    router.push(`/Akeel/Transport/History?type=Vehicle&id=${v.id}`);
  };

  const MobileCard = ({ v, idx }: { v: Vehicle; idx: number }) => (
    <div
      className="rounded-xl border border-orange-200 bg-white shadow-sm p-3 flex flex-col gap-2"
      onClick={() => openView(v)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openView(v)}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] text-gray-500">#{start + idx + 1}</div>
          <div className="text-sm font-semibold text-gray-800">{fmt(v.vehicleNumber)}</div>
          <div className="text-xs text-gray-600">{fmt(v.vehicleType)}</div>
          <div className="text-xs text-gray-600">
            <span className="font-medium">{fmt(v.brand)}</span>
            <span className="text-gray-500"> / {fmt(v.model)}</span>
          </div>
        </div>
        <StatusPill
          mode="vehicle"
          value={v.status ?? undefined}
          className="shrink-0"
          editable={!showDeleted}
          onChange={(s) => onChangeStatus(v, s as VehicleStatus)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-700">
        <div><span className="text-gray-500">Chassis:</span> {fmt(v.chassisNumber)}</div>
        <div><span className="text-gray-500">Engine:</span> {fmt(v.engineNumber)}</div>
        <div><span className="text-gray-500">Mfg:</span> {fmtDate(v.manufactureDate)}</div>
        <div>
          <span className="text-gray-500">Odo:</span>
          <div className="ml-1 inline-block align-middle">{odoText(v, true)}</div>
        </div>
        <div><span className="text-gray-500">Fuel:</span> {fmt(v.fuelEfficiency)}</div>
        <div className="col-span-2"><span className="text-gray-500">Cond.:</span> {fmt(v.presentCondition)}</div>
      </div>

      {!showDeleted && (
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            className="px-2 py-1 rounded text-orange-600 hover:bg-orange-50 text-[11px] font-medium"
            onClick={(e) => { e.stopPropagation(); printVehicle(v); }}
          >
            Print
          </button>
          <button
            className="px-2 py-1 rounded text-orange-600 hover:bg-orange-50 text-[11px] font-medium"
            onClick={(e) => { e.stopPropagation(); onOpenHistory(v); }}
          >
            History
          </button>
          <button
            className="px-2 py-1 rounded text-green-700 hover:bg-green-50 text-[11px] font-medium"
            onClick={(e) => { e.stopPropagation(); setEditing(v); setShowForm('edit'); }}
          >
            Edit
          </button>
          <button
            className="px-2 py-1 rounded text-red-600 hover:bg-red-50 text-[11px] font-medium"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(v); }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full min-h-screen p-3 sm:p-4 bg-orange-50">
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
        <div className="flex items-center mb-3 sm:mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-800 p-2 rounded-lg hover:bg-orange-50 mr-3 sm:mr-4"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">Vehicle Management</h1>
            <p className="text-xs sm:text-sm text-orange-600">
              {filtered?.length ?? 0} {showDeleted ? 'deleted' : 'active'} vehicles
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-orange-300 shadow-sm">
              <button
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium ${!showDeleted ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 hover:bg-orange-50'}`}
                onClick={() => setShowDeleted(false)}
              >
                Active
                <span className="ml-2 text-[10px] sm:text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">{vehicles.length}</span>
              </button>
              <button
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium ${showDeleted ? 'bg-red-600 text-white' : 'bg-white text-red-600 hover:bg-red-50'}`}
                onClick={() => setShowDeleted(true)}
              >
                Deleted
                <span className="ml-2 text-[10px] sm:text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">{deletedVehicles.length}</span>
              </button>
          </div>

          <div className="flex-1" />
          <div className="flex flex-wrap items-center gap-2">
            {!showDeleted && (
              <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 px-2 py-1.5 rounded-lg text-xs sm:text-sm text-orange-800 shadow-sm">
                {(['ALL','AVAILABLE','IN_SERVICE','UNDER_REPAIR','RETIRED'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s as VehicleStatus | 'ALL')}
                    className={`px-2 py-1 rounded transition-colors ${statusFilter === s ? 'bg-orange-600 text-white' : 'hover:bg-orange-100'}`}
                  >
                    {s.replace('_',' ')}
                  </button>
                ))}
              </div>
            )}
            {canCreate && !showDeleted && (
              <button
                className="flex items-center gap-2 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 shadow-sm transition-colors text-xs sm:text-sm"
                onClick={() => { setEditing(null); setShowForm('add'); }}
              >
                <Plus size={16} />
                  <span>Add Vehicle</span>
                </button>
            )}
            {canPrint && (
              <button
                className="flex items-center gap-2 bg-orange-100 text-orange-700 border border-orange-200 px-3 py-2 rounded-lg hover:bg-orange-200 shadow-sm transition-colors text-xs sm:text-sm"
                onClick={() => printVehicleList(filtered as Vehicle[], showDeleted)}
              >
                <Printer size={16} />
                <span>Print</span>
              </button>
            )}
          </div>
        </div>

          <SearchBar value={search} onChange={setSearch} placeholder="Search any field (Number, Type, Brand, Model…)" />
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-3"></div>
            <p>Loading vehicles...</p>
          </div>
        ) : isMdUp ? (
          <div className="overflow-x-auto rounded-lg border border-orange-100 mt-4 shadow-sm">
            <table className="w-full">
              <colgroup>
                <col className="w-[4%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
                <col className="w-[5%]" />
                <col className="w-[5%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
                <col className={showDeleted ? 'w-0 hidden' : 'w-[6%]'} />
              </colgroup>
              <thead className="bg-orange-50">
                <tr>
                  <Th className={`text-center ${HEAD_PY} ${HEAD_TEXT}`}>No</Th>
                  <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Number</Th>
                  <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Type</Th>
                  <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Brand / Model</Th>
                  <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Chassis</Th>
                  <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Engine</Th>
                  <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Mfg Date</Th>
                  <Th className={`text-center ${HEAD_PY} ${HEAD_TEXT}`}>Odo (reg / current)</Th>
                  <Th className={`text-center ${HEAD_PY} ${HEAD_TEXT}`}>Fuel</Th>
                  <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Condition</Th>
                  <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Status</Th>
                  {!showDeleted && (canUpdate || canDelete || canPrint) && <Th className={`text-center ${HEAD_PY} ${HEAD_TEXT}`}>Actions</Th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {rows.map((v, i) => (
                  <tr
                    key={v.id ?? `${v.vehicleNumber}-${i}`}
                    className="hover:bg-orange-50 transition-colors cursor-pointer"
                    onClick={() => openView(v)}
                  >
                    <Td className={`text-center ${ROW_PX} ${ROW_PY} ${ROW_TEXT}`}>{start + i + 1}</Td>
                    <Td className={`${ROW_PX} ${ROW_PY} ${ROW_TEXT} font-medium truncate`} title={fmt(v.vehicleNumber)}>{fmt(v.vehicleNumber)}</Td>
                    <Td className={`${ROW_PX} ${ROW_PY} ${ROW_TEXT} truncate`} title={fmt(v.vehicleType)}>{fmt(v.vehicleType)}</Td>
                    <Td className={`${ROW_PX} ${ROW_PY} ${ROW_TEXT} truncate`} title={`${fmt(v.brand)} / ${fmt(v.model)}`}>
                      <span className="font-medium">{fmt(v.brand)}</span>
                      <span className="text-gray-500"> / {fmt(v.model)}</span>
                    </Td>
                    <Td className={`${ROW_PX} ${ROW_PY} ${ROW_TEXT} truncate`} title={fmt(v.chassisNumber)}>{fmt(v.chassisNumber)}</Td>
                    <Td className={`${ROW_PX} ${ROW_PY} ${ROW_TEXT} truncate`} title={fmt(v.engineNumber)}>{fmt(v.engineNumber)}</Td>
                    <Td className={`${ROW_PX} ${ROW_PY} ${ROW_TEXT}`}>{fmtDate(v.manufactureDate)}</Td>
                    <Td className={`text-center ${ROW_PX} ${ROW_PY} ${ROW_TEXT}`}>{odoText(v, true)}</Td>
                    <Td className={`text-center ${ROW_PX} ${ROW_PY} ${ROW_TEXT}`}>{fmt(v.fuelEfficiency)}</Td>
                    <Td className={`${ROW_PX} ${ROW_PY} ${ROW_TEXT} truncate`} title={fmt(v.presentCondition)}>{fmt(v.presentCondition)}</Td>
                  <Td className={`${ROW_PX} ${ROW_PY}`} onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center">
                      <StatusPill
                        mode="vehicle"
                        value={v.status ?? undefined}
                        editable={!showDeleted && canUpdate}
                        onChange={(s) => onChangeStatus(v, s as VehicleStatus)}
                      />
                    </div>
                  </Td>
                    {!showDeleted && (canUpdate || canDelete || canPrint) && (
                      <Td className={`text-center ${ROW_PX} ${ROW_PY}`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {canPrint && (
                            <button
                              className="w-6 h-6 grid place-items-center rounded text-orange-600 hover:bg-orange-100 transition-colors"
                              title="Print"
                              onClick={(e) => { e.stopPropagation(); printVehicle(v); }}
                            >
                              <Printer size={12} />
                            </button>
                          )}
                          <button
                            className="w-6 h-6 grid place-items-center rounded text-orange-600 hover:bg-orange-100 transition-colors"
                            title="History"
                            onClick={(e) => { e.stopPropagation(); onOpenHistory(v); }}
                          >
                            <HistoryIcon size={12} />
                          </button>
                          {canUpdate && (
                            <button
                              className="w-6 h-6 grid place-items-center rounded text-green-600 hover:bg-green-100 transition-colors"
                              title="Edit"
                              onClick={(e) => { e.stopPropagation(); setEditing(v); setShowForm('edit'); }}
                            >
                              <Edit size={12} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="w-6 h-6 grid place-items-center rounded text-red-600 hover:bg-red-100 transition-colors"
                              title="Delete"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(v); }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </Td>
                    )}
                  </tr>
                ))}
                {(rows?.length ?? 0) === 0 && (
                  <tr>
                    <Td colSpan={showDeleted ? 11 : 12} className="text-center py-6 text-gray-500 text-xs">
                      No {showDeleted ? 'deleted' : 'active'} vehicles found.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rows.map((v, i) => (
              <MobileCard key={v.id ?? `${v.vehicleNumber}-${i}`} v={v} idx={i} />
            ))}
            {(rows?.length ?? 0) === 0 && (
              <div className="text-center py-8 text-gray-500 text-xs col-span-full">
                No {showDeleted ? 'deleted' : 'active'} vehicles found.
              </div>
            )}
          </div>
        )}

        <PaginationBar />
      </div>

      {showView && selected && (
        <EntityModal
          title="Vehicle Details"
          status={selected.status ?? undefined}
          onClose={() => setShowView(false)}
          top={<VehicleImagesHero vehicleId={selected.id!} />}
          fields={[
            { label: 'Vehicle Number', value: selected.vehicleNumber ?? '-' },
            { label: 'Type', value: selected.vehicleType ?? '-' },
            { label: 'Brand', value: selected.brand ?? '-' },
            { label: 'Model', value: selected.model ?? '-' },
            { label: 'Chassis Number', value: selected.chassisNumber ?? '-' },
            { label: 'Engine Number', value: selected.engineNumber ?? '-' },
            { label: 'Manufacture Date', value: fmtDate(selected.manufactureDate ?? undefined) },
            { label: 'Registered KM', value: selected.registeredKm ?? selected.totalKmDriven ?? '-' },
            { label: 'Current KM', value: selected.totalKmDriven ?? '-' },
            { label: 'Fuel Efficiency', value: selected.fuelEfficiency ?? '-' },
            { label: 'Condition', value: selected.presentCondition ?? '-' },
            { label: 'Status', value: selected.status ?? '-' },
            { label: 'Created By', value: selected.createdBy ?? '-' },
            { label: 'Created At', value: fmtDateTime(selected.createdAt) },
            { label: 'Last Modified By', value: selected.updatedBy ?? '-' },
            { label: 'Last Modified At', value: fmtDateTime(selected.updatedAt) },
            { label: 'Deleted By', value: selected.deletedBy ?? '-' },
            { label: 'Deleted At', value: fmtDateTime(selected.deletedAt) },
          ]}
        />
      )}

      {showForm && (
        <VehicleForm
          enableImages={showForm === 'add'}
          vehicle={showForm === 'edit' ? editing ?? undefined : undefined}
          onSubmit={showForm === 'edit' ? onEditSubmit : onAddSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Vehicle"
          message={`Are you sure you want to delete ${deleteTarget.vehicleNumber}?`}
          onConfirm={onDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
