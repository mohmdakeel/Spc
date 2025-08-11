import axios from "axios";
import { Vehicle, VehicleHistory, VehicleStatus } from "./types";

const API = "/api/vehicles"; // proxied by next.config.mjs

export const fetchVehicles = async (): Promise<Vehicle[]> =>
  (await axios.get(API)).data;

export const fetchDeletedVehicles = async (): Promise<Vehicle[]> =>
  (await axios.get(`${API}/deleted`)).data;

export const fetchVehicleById = async (id: number): Promise<Vehicle> =>
  (await axios.get(`${API}/${id}`)).data;

export const addVehicle = async (v: Partial<Vehicle>): Promise<Vehicle> =>
  (await axios.post(API, normalizeForApi(v))).data;

export const updateVehicle = async (id: number, v: Partial<Vehicle>): Promise<Vehicle> =>
  (await axios.put(`${API}/${id}`, normalizeForApi(v))).data;

export const deleteVehicle = async (id: number): Promise<void> =>
  void (await axios.delete(`${API}/${id}`));

export const changeVehicleStatus = async (id: number, status: VehicleStatus): Promise<Vehicle> =>
  (await axios.put(`${API}/${id}/status?status=${status}`)).data;

export const fetchVehicleHistory = async (id: number): Promise<VehicleHistory[]> =>
  (await axios.get(`${API}/${id}/history`)).data;

// ---------- helpers ----------
function normalizeForApi(v: Partial<Vehicle>): Partial<Vehicle> {
  const copy: any = { ...v };

  // manufactureDate: "yyyy-MM-dd" | ISO | Date | null -> ISO or null
  if (copy.manufactureDate instanceof Date) {
    copy.manufactureDate = copy.manufactureDate.toISOString();
  } else if (typeof copy.manufactureDate === "string") {
    const s = copy.manufactureDate.trim();
    copy.manufactureDate = s
      ? (s.length === 10 ? new Date(s + "T00:00:00.000Z").toISOString() : s)
      : null;
  } else if (!copy.manufactureDate) {
    copy.manufactureDate = null;
  }

  // text optionals: "" -> null
  for (const k of ["vehicleType","brand","model","chassisNumber","engineNumber","presentCondition"]) {
    if (copy[k] !== undefined && String(copy[k]).trim() === "") copy[k] = null;
  }

  // numeric optionals: "" -> null
  if (copy.totalKmDriven === ("" as any)) copy.totalKmDriven = null;
  if (copy.fuelEfficiency === ("" as any)) copy.fuelEfficiency = null;

  return copy;
}
