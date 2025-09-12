// src/app/Akeel/Transport/services/vehicleService.ts
import { API_BASE, parseJson, throwHttp, unwrapApi } from './config';
import { Vehicle, ApiResponse, ChangeHistory, VehicleStatus } from './types';
import { fetchTimeline } from './historyService';

const API = `${API_BASE}/api/vehicles`;

/** Coerce numeric-ish inputs to numbers; return undefined for '', null, undefined */
function toNumOrUndef(v: unknown): number | undefined {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = Number(v as any);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Fetch ALL active vehicles (client-side pagination).
 * We request a large page size to get all rows.
 */
export async function fetchVehicles(search?: string): Promise<Vehicle[]> {
  const params = new URLSearchParams({ page: '0', size: '1000' });
  if (search && search.trim()) params.set('search', search.trim());

  const r = await fetch(`${API}?${params.toString()}`, { cache: 'no-store' });
  if (!r.ok) await throwHttp(r, 'Failed to fetch vehicles');

  // Backend wraps Page<Vehicle> in ApiResponse
  const body = unwrapApi<ApiResponse<any> | any>(await parseJson(r)) as any;
  const content = body?.content ?? body ?? [];
  return Array.isArray(content) ? content : [];
}

/** Fetch ALL deleted vehicles (client-side pagination) */
export async function fetchDeletedVehicles(search?: string): Promise<Vehicle[]> {
  const params = new URLSearchParams({ page: '0', size: '1000' });
  if (search && search.trim()) params.set('search', search.trim());

  const r = await fetch(`${API}/deleted?${params.toString()}`, { cache: 'no-store' });
  if (!r.ok) await throwHttp(r, 'Failed to fetch deleted vehicles');

  const body = unwrapApi<any>(await parseJson(r));
  const content = body?.content ?? body ?? [];
  return Array.isArray(content) ? content : [];
}

/** GET /api/vehicles/{id} */
export async function fetchVehicleById(id: number | string): Promise<Vehicle> {
  const r = await fetch(`${API}/${id}`, { cache: 'no-store' });
  if (!r.ok) await throwHttp(r, 'Vehicle not found');
  return unwrapApi<Vehicle>(await parseJson(r));
}

/** POST /api/vehicles */
export async function addVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
  // Backend generates ID — do NOT send 'id' in create payload
  const payload: any = { ...data };
  delete payload.id;

  // Clean numeric fields safely
  payload.totalKmDriven = toNumOrUndef(payload.totalKmDriven);
  payload.fuelEfficiency = toNumOrUndef(payload.fuelEfficiency);

  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Actor': 'ui' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) await throwHttp(r, 'Failed to add vehicle');
  return unwrapApi<Vehicle>(await parseJson(r));
}

/** PUT /api/vehicles/{id} */
export async function updateVehicle(id: number | string, patch: Partial<Vehicle>): Promise<Vehicle> {
  const payload: any = { ...patch };

  // Clean numeric fields safely
  if ('totalKmDriven' in payload) payload.totalKmDriven = toNumOrUndef(payload.totalKmDriven);
  if ('fuelEfficiency' in payload) payload.fuelEfficiency = toNumOrUndef(payload.fuelEfficiency);

  const r = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Actor': 'ui' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) await throwHttp(r, 'Failed to update vehicle');
  return unwrapApi<Vehicle>(await parseJson(r));
}

/** DELETE /api/vehicles/{id} */
export async function deleteVehicle(id: number | string): Promise<void> {
  const r = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers: { 'X-Actor': 'ui' },
  });
  if (!r.ok) await throwHttp(r, 'Failed to delete vehicle');
}

/** Vehicle history — reuse History endpoints */
export async function fetchVehicleHistory(id: number | string): Promise<ChangeHistory[]> {
  return fetchTimeline('Vehicle', String(id));
}

/** Helper to set status via update */
export async function updateVehicleStatus(id: number | string, status: VehicleStatus): Promise<Vehicle> {
  return updateVehicle(id, { status });
}
