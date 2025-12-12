'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Printer, History as HistoryIcon, Edit, Trash2, Plus, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

import { fetchDrivers, fetchDeletedDrivers, addDriver, updateDriver, deleteDriver } from '../services/driverService';
import DriverForm from './DriverForm';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import EntityModal from '../components/EntityModal';
import StatusPill from '../components/StatusPill';
import SearchBar from '../components/SearchBar';
import { Th, Td } from '../components/ThTd';
import { printDriver, printDriverList } from '../utils/print';
import type { Driver, DriverStatus } from '../services/types';
import { useAuth } from '../../../../../hooks/useAuth';

const ITEMS_PER_PAGE = 10;
const ROW_TEXT = 'text-xs';
const ROW_PX = 'px-2';
const ROW_PY = 'py-2';
const HEAD_TEXT = 'text-xs font-semibold text-orange-800';
const HEAD_PY = 'py-2';
const EXP_SOON_DAYS = 30;

const fmt = (v: unknown) => (v == null || v === '' ? '-' : String(v));
const fmtDate = (s?: string | Date | null) => (s ? new Date(s as any).toLocaleDateString() : '-');
const fmtDateTime = (s?: string | Date | null) => (s ? new Date(s as any).toLocaleString() : '-');

function getExpiryState(expiry?: string | null) {
  if (!expiry) return { label: '—', chip: 'bg-gray-100 text-gray-700' };
  const d = new Date(expiry);
  if (isNaN(d.getTime())) return { label: '—', chip: 'bg-gray-100 text-gray-700' };
  const today = new Date(); today.setHours(0,0,0,0);
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return { label: `Expired (${fmtDate(expiry)})`, chip: 'bg-red-100 text-red-700' };
  if (diffDays <= EXP_SOON_DAYS) return { label: `Expiring Soon (${fmtDate(expiry)})`, chip: 'bg-amber-100 text-amber-800' };
  return { label: `Valid (${fmtDate(expiry)})`, chip: 'bg-green-100 text-green-700' };
}

export default function DriverListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const roles = (user?.roles || []).map(r => r.toUpperCase());
  const perms = (user?.permissions || []).map(p => p.toUpperCase());
  const isAdmin = roles.some((r) => ['ADMIN', 'TRANSPORT_ADMIN'].includes(r));
  const canCreate = isAdmin || perms.includes('CREATE');
  const canUpdate = isAdmin || perms.includes('UPDATE');
  const canDelete = isAdmin || perms.includes('DELETE');
  const canPrint = isAdmin || perms.includes('PRINT') || perms.includes('READ');
  const [statusFilter, setStatusFilter] = useState<DriverStatus | 'ALL'>('ALL');

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [deletedDrivers, setDeletedDrivers] = useState<Driver[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [showForm, setShowForm] = useState<false | 'add' | 'edit'>(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [active, deleted] = await Promise.all([fetchDrivers(), fetchDeletedDrivers()]);
      setDrivers(Array.isArray(active) ? active : []);
      setDeletedDrivers(Array.isArray(deleted) ? deleted : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load drivers');
      setDrivers([]); setDeletedDrivers([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const list = showDeleted ? deletedDrivers : drivers;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const statusFiltered = statusFilter === 'ALL'
      ? (list || [])
      : (list || []).filter(d => (d.status || 'ACTIVE').toUpperCase() === statusFilter.toUpperCase());
    if (!q) return statusFiltered;
    return statusFiltered.filter((d) =>
      [
        d.employeeId, d.name, d.phone, d.email,
        d.licenseNumber, d.licenseExpiryDate, d.drivingExperience, d.status,
      ].map(x => (x ?? '').toString().toLowerCase()).join(' ').includes(q)
    );
  }, [list, search, statusFilter]);

  useEffect(() => { setPage(1); }, [search, showDeleted]);

  const totalPages = Math.max(1, Math.ceil((filtered?.length ?? 0) / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE;
  const rows = (filtered ?? []).slice(start, start + ITEMS_PER_PAGE);
  const goTo = (p: number) => setPage(Math.min(totalPages, Math.max(1, p)));

  const PaginationBar = () => {
    if (!filtered.length) return null;
    const windowSize = 5;
    const first = 1;
    const last = totalPages;
    const startWin = Math.max(first, page - Math.floor(windowSize / 2));
    const endWin = Math.min(last, startWin + windowSize - 1);
    const nums: number[] = [];
    for (let i = startWin; i <= endWin; i++) nums.push(i);
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-orange-50 rounded-lg border border-orange-100 mt-4">
        <span className="text-xs text-orange-800">
          Showing {filtered.length ? start + 1 : 0}–{Math.min(start + ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => goTo(page - 1)} disabled={page === 1}
            className={`p-2 rounded-md ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-orange-600 hover:bg-orange-100'}`}
            aria-label="Previous page"><ChevronLeft size={16} /></button>

          {startWin > first && (
            <>
              <button onClick={() => goTo(first)}
                className={`px-3 py-1 rounded-md ${page === first ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-100'}`}>1</button>
              {startWin > first + 1 && <span className="px-1">…</span>}
            </>
          )}

          {nums.map(n => (
            <button key={n} onClick={() => goTo(n)}
              className={`px-3 py-1 rounded-md ${page === n ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-100'}`}>{n}</button>
          ))}

          {endWin < last && (
            <>
              {endWin < last - 1 && <span className="px-1">…</span>}
              <button onClick={() => goTo(last)}
                className={`px-3 py-1 rounded-md ${page === last ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-100'}`}>{last}</button>
            </>
          )}

          <button onClick={() => goTo(page + 1)} disabled={page === totalPages}
            className={`p-2 rounded-md ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-orange-600 hover:bg-orange-100'}`}
            aria-label="Next page"><ChevronRight size={16} /></button>
        </div>
      </div>
    );
  };

  const onAddSubmit = async (payload: Partial<Driver>) => {
    if (!canCreate) { toast.error('You do not have permission to add drivers.'); return; }
    try {
      await addDriver(payload);
      toast.success('Driver added successfully');
      setShowForm(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add driver');
    }
  };

  const onEditSubmit = async (payload: Partial<Driver>) => {
    if (!canUpdate) { toast.error('You do not have permission to update drivers.'); return; }
    try {
      if (!editing?.employeeId) throw new Error('No driver selected for editing');
      await updateDriver(editing.employeeId, payload);
      toast.success('Driver updated successfully');
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update driver');
    }
  };

  const onDelete = async () => {
    if (!canDelete) { toast.error('You do not have permission to delete drivers.'); return; }
    if (!deleteTarget?.employeeId) return;
    try {
      await deleteDriver(deleteTarget.employeeId);
      toast.success('Driver deleted successfully');
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete driver');
    }
  };

  // ✅ minimal payload now that backend update is less strict
  const onChangeStatus = async (d: Driver, status: DriverStatus) => {
    try {
      await updateDriver(d.employeeId, { status });
      toast.success('Status updated');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to change status');
    }
  };

  const driverColsActive = [
    'w-[5%]', 'w-[10%]', 'w-[12%]', 'w-[10%]', 'w-[15%]', 'w-[10%]',
    'w-[8%]', 'w-[12%]', 'w-[8%]', 'w-[10%]',
  ];
  const driverColsDeleted = driverColsActive.slice(0, -1);
  const dCols = showDeleted ? driverColsDeleted : driverColsActive;

  return (
    <div className="w-full min-h-screen p-4 bg-orange-50">
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center mb-4">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-800 p-2 rounded-lg hover:bg-orange-50 mr-4">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Driver Management</h1>
            <p className="text-sm text-orange-600">
              {filtered?.length ?? 0} {showDeleted ? 'deleted' : 'active'} drivers
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-orange-300 shadow-sm">
              <button
                className={`px-4 py-2 text-sm font-medium ${!showDeleted ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 hover:bg-orange-50'}`}
                onClick={() => setShowDeleted(false)}
              >
                Active
                <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">{drivers.length}</span>
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${showDeleted ? 'bg-red-600 text-white' : 'bg-white text-red-600 hover:bg-red-50'}`}
                onClick={() => setShowDeleted(true)}
              >
                Deleted
                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">{deletedDrivers.length}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!showDeleted && (
              <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 px-2 py-1.5 rounded-lg text-xs sm:text-sm text-orange-800 shadow-sm">
                {(['ALL','ACTIVE','INACTIVE','SUSPENDED'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s as DriverStatus | 'ALL')}
                    className={`px-2 py-1 rounded transition-colors ${statusFilter === s ? 'bg-orange-600 text-white' : 'hover:bg-orange-100'}`}
                  >
                    {s.replace('_',' ')}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {canCreate && !showDeleted && (
                <button
                  className="flex items-center gap-2 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 shadow-sm transition-colors text-sm"
                  onClick={() => { setEditing(null); setShowForm('add'); }}
                >
                  <Plus size={16} /><span>Add Driver</span>
                </button>
              )}
              {canPrint && (
                <button
                  className="flex items-center gap-2 bg-orange-100 text-orange-700 border border-orange-200 px-3 py-2 rounded-lg hover:bg-orange-200 shadow-sm transition-colors text-sm"
                  onClick={() => printDriverList(filtered as Driver[], showDeleted)}
                >
                  <Printer size={16} /><span>Print</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Search any field (ID, name, phone, email…)" />

        {loading ? (
          <div className="text-center py-16 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-3"></div>
            <p>Loading drivers...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-orange-100 mt-4 shadow-sm">
              <table className="w-full">
                <colgroup>
                  {dCols.map((w, i) => <col key={i} className={w} />)}
                </colgroup>
                <thead className="bg-orange-50 sticky top-0 z-10">
                  <tr>
                    <Th className={`text-center ${HEAD_PY} ${HEAD_TEXT}`}>No</Th>
                    <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Employee ID</Th>
                    <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Name</Th>
                    <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Phone</Th>
                    <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Email</Th>
                    <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>License NO</Th>
                    <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Experience (yrs)</Th>
                    <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>License Expiry</Th>
                    <Th className={`${HEAD_PY} ${HEAD_TEXT}`}>Status</Th>
                    {!showDeleted && (canUpdate || canDelete || canPrint) && <Th className={`text-center ${HEAD_PY} ${HEAD_TEXT}`}>Actions</Th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100">
                  {rows.map((d, i) => {
                    const exp = getExpiryState(d.licenseExpiryDate);
                    return (
                      <tr
                        key={d.employeeId}
                        className="hover:bg-orange-50 transition-colors cursor-pointer"
                        onClick={() => setSelected(d)}
                      >
                        <Td className={`text-center ${ROW_PX} ${ROW_PY} ${ROW_TEXT}`}>{start + i + 1}</Td>
                        <Td className={`${ROW_PX} ${ROW_PY} ${ROW_TEXT} truncate`} title={fmt(d.employeeId)}><span className="font-medium">{fmt(d.employeeId)}</span></Td>
                        <Td className={`${ROW_PX} ${ROW_PY} ${ROW_TEXT} truncate`} title={fmt(d.name)}>{fmt(d.name)}</Td>
                        <Td className={`${ROW_PX} ${ROW_PY} ${ROW_TEXT} truncate`} title={fmt(d.phone)}>{fmt(d.phone)}</Td>
                        <Td className={`${ROW_PX} ${ROW_PY} ${ROW_TEXT} truncate`} title={fmt(d.email)}>{fmt(d.email)}</Td>
                        <Td className={`${ROW_PX} ${ROW_PY} ${ROW_TEXT} truncate`} title={fmt(d.licenseNumber)}>{fmt(d.licenseNumber)}</Td>
                        <Td className={`text-center ${ROW_PX} ${ROW_PY} ${ROW_TEXT} truncate`} title={fmt(d.drivingExperience)}>{fmt(d.drivingExperience)}</Td>
                        <Td className={`text-center ${ROW_PX} ${ROW_PY} ${ROW_TEXT}`} title={fmtDate(d.licenseExpiryDate)}>
                          <span className={`inline-block rounded px-2 py-0.5 text-xs ${exp.chip}`}>{exp.label}</span>
                        </Td>
                        <Td className={`text-center ${ROW_PX} ${ROW_PY}`} onClick={(e) => e.stopPropagation()}>
                          <StatusPill
                            mode="driver"
                            value={d.status}
                            editable={!showDeleted && canUpdate}
                            onChange={(s) => onChangeStatus(d, s as DriverStatus)}
                          />
                        </Td>
                        {!showDeleted && (canUpdate || canDelete || canPrint) && (
                          <Td className={`text-center ${ROW_PX} ${ROW_PY}`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              {canPrint && (
                                <button className="w-6 h-6 grid place-items-center rounded text-orange-600 hover:bg-orange-100 transition-colors"
                                  onClick={() => printDriver(d)} title="Print" aria-label="Print">
                                  <Printer size={14} />
                                </button>
                              )}
                              <button className="w-6 h-6 grid place-items-center rounded text-orange-600 hover:bg-orange-100 transition-colors"
                                onClick={() => router.push(`/Akeel/Transport/History?type=Driver&id=${encodeURIComponent(d.employeeId)}`)}
                                title="History" aria-label="History">
                                <HistoryIcon size={14} />
                              </button>
                              {canUpdate && (
                                <button className="w-6 h-6 grid place-items-center rounded text-green-600 hover:bg-green-100 transition-colors"
                                  onClick={() => { setEditing(d); setShowForm('edit'); }} title="Edit" aria-label="Edit">
                                  <Edit size={14} />
                                </button>
                              )}
                              {canDelete && (
                                <button className="w-6 h-6 grid place-items-center rounded text-red-600 hover:bg-red-100 transition-colors"
                                  onClick={() => setDeleteTarget(d)} title="Delete" aria-label="Delete">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </Td>
                        )}
                      </tr>
                    );
                  })}
                  {(rows?.length ?? 0) === 0 && (
                    <tr>
                      <Td colSpan={showDeleted ? 9 : 10} className="text-center py-6 text-gray-500">
                        No {showDeleted ? 'deleted' : 'active'} drivers found.
                      </Td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationBar />
          </>
        )}
      </div>

      {showForm && (
        <DriverForm
          driver={showForm === 'edit' ? editing ?? undefined : undefined}
          onSubmit={showForm === 'edit' ? onEditSubmit : onAddSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Driver"
          message={`Are you sure you want to delete ${deleteTarget.name}?`}
          onConfirm={onDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {selected && (
        <EntityModal
          title="Driver Details"
          onClose={() => setSelected(null)}
          fields={[
            { label: 'Employee ID', value: selected.employeeId },
            { label: 'Name', value: selected.name },
            { label: 'Phone', value: selected.phone ?? '-' },
            { label: 'Email', value: selected.email ?? '-' },
            { label: 'License Number', value: selected.licenseNumber ?? '-' },
            { label: 'License Expiry', value: fmtDate(selected.licenseExpiryDate) },
            { label: 'Experience (years)', value: selected.drivingExperience ?? '-' },
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
    </div>
  );
}
