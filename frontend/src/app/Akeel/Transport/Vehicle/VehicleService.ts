import axios from "axios";
import { Vehicle, VehicleHistory, VehicleStatus } from "./types";

const API = "/api/vehicles";

export const fetchVehicles = async (): Promise<Vehicle[]> => {
  const { data } = await axios.get(API);
  return data;
};

export const fetchDeletedVehicles = async (): Promise<Vehicle[]> => {
  const { data } = await axios.get(`${API}/deleted`);
  return data;
};

export const fetchVehicleById = async (id: number): Promise<Vehicle> => {
  const { data } = await axios.get(`${API}/${id}`);
  // backend returns Vehicle directly (your controller returns Vehicle in GET /{id})
  return data;
};

export const addVehicle = async (v: Partial<Vehicle>): Promise<Vehicle> => {
  const payload = normalizeForApi(v);
  const { data } = await axios.post(API, payload);
  return data;
};

export const updateVehicle = async (id: number, v: Partial<Vehicle>): Promise<Vehicle> => {
  const payload = normalizeForApi(v);
  const { data } = await axios.put(`${API}/${id}`, payload);
  return data;
};

export const deleteVehicle = async (id: number): Promise<void> => {
  await axios.delete(`${API}/${id}`);
};

export const changeVehicleStatus = async (id: number, status: VehicleStatus): Promise<Vehicle> => {
  const { data } = await axios.put(`${API}/${id}/status?status=${status}`);
  return data;
};

export const fetchVehicleHistory = async (id: number): Promise<VehicleHistory[]> => {
  const { data } = await axios.get(`${API}/${id}/history`);
  return data;
};

/** Convert form values to API-friendly payload (dates to ISO string, numbers preserved) */
function normalizeForApi(v: Partial<Vehicle>): Partial<Vehicle> {
  const copy: any = { ...v };
  if (copy.manufactureDate instanceof Date) {
    copy.manufactureDate = copy.manufactureDate.toISOString();
  }
  return copy;
}
