import { API_BASE, parseJson, throwHttp, unwrapApi } from './config';
import { Driver, ApiResponse, ChangeHistory } from './types';
import { fetchTimeline } from './historyService';

const API = `${API_BASE}/api/drivers`;

/**
 * Fetch ALL active drivers (client-side pagination).
 * We request a large page size to get all rows.
 */
export async function fetchDrivers(search?: string): Promise<Driver[]> {
  const params = new URLSearchParams({
    page: '0',
    size: '1000',
  });
  if (search && search.trim()) params.set('search', search.trim());

  const r = await fetch(`${API}?${params.toString()}`, { cache: 'no-store' });
  if (!r.ok) await throwHttp(r, 'Failed to fetch drivers');

  // Backend wraps Page<Driver> in ApiResponse
  // data = { content, totalElements, ... }
  const body = unwrapApi<ApiResponse<any> | any>(await parseJson(r)) as any;
  const content = body?.content ?? body ?? [];
  return Array.isArray(content) ? content : [];
}

/** Fetch ALL deleted drivers (client-side pagination) */
export async function fetchDeletedDrivers(search?: string): Promise<Driver[]> {
  const params = new URLSearchParams({
    page: '0',
    size: '1000',
  });
  if (search && search.trim()) params.set('search', search.trim());

  const r = await fetch(`${API}/deleted?${params.toString()}`, { cache: 'no-store' });
  if (!r.ok) await throwHttp(r, 'Failed to fetch deleted drivers');

  const body = unwrapApi<any>(await parseJson(r));
  const content = body?.content ?? body ?? [];
  return Array.isArray(content) ? content : [];
}

/** GET /api/drivers/{employeeId} */
export async function fetchDriverById(employeeId: string): Promise<Driver> {
  const r = await fetch(`${API}/${employeeId}`, { cache: 'no-store' });
  if (!r.ok) await throwHttp(r, 'Driver not found');
  return unwrapApi<Driver>(await parseJson(r));
}

/** POST /api/drivers */
export async function addDriver(data: Partial<Driver>): Promise<Driver> {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Actor': 'ui' },
    body: JSON.stringify(data),
  });
  if (!r.ok) await throwHttp(r, 'Failed to add driver');
  return unwrapApi<Driver>(await parseJson(r));
}

/** PUT /api/drivers/{employeeId} */
export async function updateDriver(employeeId: string, patch: Partial<Driver>): Promise<Driver> {
  const r = await fetch(`${API}/${employeeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Actor': 'ui' },
    body: JSON.stringify(patch),
  });
  if (!r.ok) await throwHttp(r, 'Failed to update driver');
  return unwrapApi<Driver>(await parseJson(r));
}

/** DELETE /api/drivers/{employeeId} */
export async function deleteDriver(employeeId: string): Promise<void> {
  const r = await fetch(`${API}/${employeeId}`, {
    method: 'DELETE',
    headers: { 'X-Actor': 'ui' },
  });
  if (!r.ok) await throwHttp(r, 'Failed to delete driver');
}

/** Driver history — reuse History endpoints */
export async function fetchDriverHistory(employeeId: string): Promise<ChangeHistory[]> {
  return fetchTimeline('Driver', employeeId);
}
