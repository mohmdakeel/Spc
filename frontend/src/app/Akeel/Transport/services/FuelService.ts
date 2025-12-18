import http, { unwrapApi } from "./http";
import type { FuelLog } from "./types";

export type FuelLogPayload = {
  vehicleId: number | string;
  month?: string;      // yyyy-MM
  startOdo?: number | null;
  endOdo?: number | null;
  deltaKm?: number | null;
  litres?: number | null;
  logDate?: string | null; // yyyy-MM-dd
  pricePerL?: number | null;
  efficiencyUsed?: number | null;
  cost?: number | null;
  fuelType?: "PETROL" | "DIESEL";
};

export async function listFuelLogs(params: { month?: string; vehicleId?: number | string; from?: string; to?: string }): Promise<FuelLog[]> {
  const { data } = await http.get("/fuel-logs", { params });
  return unwrapApi<FuelLog[]>(data);
}

export async function createFuelLog(payload: FuelLogPayload): Promise<FuelLog> {
  const { data } = await http.post("/fuel-logs", payload);
  return unwrapApi<FuelLog>(data);
}
