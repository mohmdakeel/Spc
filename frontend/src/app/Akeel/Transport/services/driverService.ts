import type { AxiosError } from "axios";
import http, { unwrapApi } from "./http";
import type { Driver, PaginationResponse, ChangeHistory } from "./types";
import { fetchTimeline } from "./historyService";

const API = "/drivers";
const API_DELETED = "/drivers/deleted";
const asMsg = (e: unknown, fb: string) => (e as AxiosError<any>)?.response?.data?.message || (e as any)?.message || fb;

function unwrapPage<T>(body: any): T[] {
  const u = unwrapApi<PaginationResponse<T> | T[] | { content: T[] }>(body);
  if (Array.isArray(u)) return u;
  if (u && Array.isArray((u as any).content)) return (u as any).content;
  return [];
}

/** Queries */
export async function fetchDrivers(search?: string): Promise<Driver[]> {
  try {
    const { data } = await http.get(API, { params: { page: 0, size: 1000, ...(search?.trim() ? { search: search.trim() } : {}) } });
    return unwrapPage<Driver>(data);
  } catch (e) { throw new Error(asMsg(e, "Failed to fetch drivers")); }
}

export async function fetchDeletedDrivers(search?: string): Promise<Driver[]> {
  try {
    const { data } = await http.get(API_DELETED, { params: { page: 0, size: 1000, ...(search?.trim() ? { search: search.trim() } : {}) } });
    return unwrapPage<Driver>(data);
  } catch (e) { throw new Error(asMsg(e, "Failed to fetch deleted drivers")); }
}

export async function fetchDriverById(employeeId: string): Promise<Driver> {
  try {
    const { data } = await http.get(`${API}/${employeeId}`);
    return unwrapApi<Driver>(data);
  } catch (e) { throw new Error(asMsg(e, "Driver not found")); }
}

/** Mutations */
export async function addDriver(payload: Partial<Driver>): Promise<Driver> {
  try {
    const { data } = await http.post(API, payload);
    return unwrapApi<Driver>(data);
  } catch (e) { throw new Error(asMsg(e, "Failed to add driver")); }
}

export async function updateDriver(employeeId: string, patch: Partial<Driver>): Promise<Driver> {
  try {
    const { data } = await http.put(`${API}/${employeeId}`, patch);
    return unwrapApi<Driver>(data);
  } catch (e) { throw new Error(asMsg(e, "Failed to update driver")); }
}

export async function deleteDriver(employeeId: string): Promise<void> {
  try { await http.delete(`${API}/${employeeId}`); } catch (e) { throw new Error(asMsg(e, "Failed to delete driver")); }
}

/** History */
export async function fetchDriverHistory(employeeId: string): Promise<ChangeHistory[]> {
  return fetchTimeline("Driver", employeeId);
}
