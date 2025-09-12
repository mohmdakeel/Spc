// src/app/Akeel/Transport/services/usageService.ts
import http from './http';

export type RequestStatus =
  | 'PENDING_HOD' | 'REJECTED' | 'PENDING_MANAGEMENT'
  | 'APPROVED' | 'SCHEDULED' | 'DISPATCHED' | 'RETURNED';

export type UsageRequest = {
  id: number; requestCode: string;
  applicantName: string; employeeId: string; department: string;
  dateOfTravel: string; timeFrom: string; timeTo: string;
  fromLocation: string; toLocation: string;
  officialDescription?: string; goods?: string;
  status: RequestStatus;
  assignedVehicleNumber?: string; assignedDriverName?: string; assignedDriverPhone?: string;
  scheduledPickupAt?: string; scheduledReturnAt?: string;
  gateExitAt?: string; gateEntryAt?: string;
  // NEW (optional) odometer logs
  exitOdometerKm?: number | null;
  entryOdometerKm?: number | null;
};

export async function createUsageRequest(payload: any) {
  const { data } = await http.post('/usage-requests', payload);
  return data as UsageRequest;
}
export async function listAllRequests() {
  const { data } = await http.get('/usage-requests');
  return data as UsageRequest[];
}
export async function getRequest(id: number) {
  const { data } = await http.get(`/usage-requests/${id}`);
  return data as UsageRequest;
}
export async function listByStatus(status: RequestStatus) {
  const { data } = await http.get(`/usage-requests/status/${status}`);
  return data as UsageRequest[];
}
export async function hodApprove(id: number, actor: string, remarks?: string) {
  const { data } = await http.post(`/usage-requests/${id}/hod/approve`, { actor, remarks });
  return data as UsageRequest;
}
export async function hodReject(id: number, actor: string, remarks?: string) {
  const { data } = await http.post(`/usage-requests/${id}/hod/reject`, { actor, remarks });
  return data as UsageRequest;
}
export async function mgmtApprove(id: number, actor: string, remarks?: string) {
  const { data } = await http.post(`/usage-requests/${id}/mgmt/approve`, { actor, remarks });
  return data as UsageRequest;
}
export async function mgmtReject(id: number, actor: string, remarks?: string) {
  const { data } = await http.post(`/usage-requests/${id}/mgmt/reject`, { actor, remarks });
  return data as UsageRequest;
}

// Single assign (kept)
export async function assignVehicle(id: number, payload: any) {
  const { data } = await http.post(`/usage-requests/${id}/assign`, payload);
  return data as UsageRequest;
}

// NEW: pool-assign multiple requests into one trip window
export async function poolAssign(requestIds: number[], payload: any) {
  const { data } = await http.post(`/usage-requests/pool-assign`, {
    requestIds, ...payload,
  });
  return data as UsageRequest[];
}

// Gate logs now support odometer entries (optional)
export async function gateExit(id: number, actor: string, exitOdometerKm?: number) {
  const { data } = await http.post(`/usage-requests/${id}/gate/exit`, { actor, exitOdometerKm });
  return data as UsageRequest;
}
export async function gateEntry(id: number, actor: string, entryOdometerKm?: number) {
  const { data } = await http.post(`/usage-requests/${id}/gate/entry`, { actor, entryOdometerKm });
  return data as UsageRequest;
}

// Dashboard metrics (unchanged)
export async function metrics() {
  const { data } = await http.get('/usage-requests/metrics');
  return data as { total: number; byStatus: Record<string, number>; nextDayTop10: UsageRequest[] };
}

// NEW: availability (vehicle/driver) for a time window
export type Availability = {
  vehicles: Array<{ id: number; vehicleNumber: string; busy: boolean; reason?: string }>;
  drivers: Array<{ id: number; name: string; busy: boolean; reason?: string }>;
};
export async function getAvailability(fromISO: string, toISO: string) {
  const { data } = await http.get('/usage-requests/availability', { params: { from: fromISO, to: toISO } });
  return data as Availability;
}
