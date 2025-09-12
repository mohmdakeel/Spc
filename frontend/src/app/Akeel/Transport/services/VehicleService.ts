import type { AxiosError } from "axios";
import http, { unwrapApi } from "./http";
import type { Vehicle, ApiResponse, PaginationResponse, ChangeHistory, VehicleStatus, EntityId } from "./types";
import { fetchTimeline } from "./historyService";

const API = "/vehicles";
const API_DELETED = "/vehicles/deleted";

const toNum = (v: unknown) => (v === "" || v == null ? undefined : (Number(v as any) || undefined));
const asMsg = (e: unknown, fb: string) => (e as AxiosError<any>)?.response?.data?.message || (e as any)?.message || fb;

function unwrapPage<T>(body: any): T[] {
  const u = unwrapApi<PaginationResponse<T> | T[] | { content: T[] }>(body);
  if (Array.isArray(u)) return u;
  if (u && Array.isArray((u as any).content)) return (u as any).content;
  return [];
}

/** Queries */
export async function fetchVehicles(search?: string): Promise<Vehicle[]> {
  try {
    const { data } = await http.get(API, { params: { page: 0, size: 1000, ...(search?.trim() ? { search: search.trim() } : {}) } });
    return unwrapPage<Vehicle>(data);
  } catch (e) { throw new Error(asMsg(e, "Failed to fetch vehicles")); }
}

export async function fetchDeletedVehicles(search?: string): Promise<Vehicle[]> {
  try {
    const { data } = await http.get(API_DELETED, { params: { page: 0, size: 1000, ...(search?.trim() ? { search: search.trim() } : {}) } });
    return unwrapPage<Vehicle>(data);
  } catch (e) { throw new Error(asMsg(e, "Failed to fetch deleted vehicles")); }
}

export async function fetchVehicleById(id: EntityId): Promise<Vehicle> {
  try {
    const { data } = await http.get(`${API}/${id}`);
    return unwrapApi<Vehicle>(data);
  } catch (e) { throw new Error(asMsg(e, "Vehicle not found")); }
}

/** Mutations */
export async function addVehicle(payload: Partial<Vehicle>): Promise<Vehicle> {
  try {
    const body: any = { ...payload }; delete body.id;
    if ("totalKmDriven" in body)  body.totalKmDriven  = toNum(body.totalKmDriven);
    if ("fuelEfficiency" in body) body.fuelEfficiency = toNum(body.fuelEfficiency);
    const { data } = await http.post(API, body);
    return unwrapApi<Vehicle>(data);
  } catch (e) { throw new Error(asMsg(e, "Failed to add vehicle")); }
}

export async function updateVehicle(id: EntityId, patch: Partial<Vehicle>): Promise<Vehicle> {
  try {
    const body: any = { ...patch };
    if ("totalKmDriven" in body)  body.totalKmDriven  = toNum(body.totalKmDriven);
    if ("fuelEfficiency" in body) body.fuelEfficiency = toNum(body.fuelEfficiency);
    const { data } = await http.put(`${API}/${id}`, body);
    return unwrapApi<Vehicle>(data);
  } catch (e) { throw new Error(asMsg(e, "Failed to update vehicle")); }
}

export async function deleteVehicle(id: EntityId): Promise<void> {
  try { await http.delete(`${API}/${id}`); } catch (e) { throw new Error(asMsg(e, "Failed to delete vehicle")); }
}

export async function updateVehicleStatus(id: EntityId, status: VehicleStatus): Promise<Vehicle> {
  return updateVehicle(id, { status });
}

/** History */
export async function fetchVehicleHistory(id: EntityId): Promise<ChangeHistory[]> {
  return fetchTimeline("Vehicle", String(id));
}
