import http, { unwrapApi } from "./http";
import type { BusyWindow, DriverAvailability, VehicleAvailability } from "./types";

export async function fetchDriverAvailability(params: { date: string; from?: string; to?: string }) {
  const { data } = await http.get("/availability/drivers", { params });
  return unwrapApi<DriverAvailability[]>(data);
}

export async function fetchVehicleAvailability(params: { date: string; from?: string; to?: string }) {
  const { data } = await http.get("/availability/vehicles", { params });
  return unwrapApi<VehicleAvailability[]>(data);
}

export type { BusyWindow };
