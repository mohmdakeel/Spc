import http, { unwrapApi } from "./http";
import type { UsageRequest, RequestStatus, Page } from "./types";

/* =========================
   Create & Read
   ========================= */
export type CreateUsageRequestDto = {
  applicantName: string;
  employeeId: string;
  department: string;

  /** NEW (optional): applicant’s applied date (yyyy-mm-dd). Backend can default to today. */
  appliedDate?: string;

  dateOfTravel: string; // yyyy-mm-dd
  returnDate?: string | null; // optional yyyy-mm-dd (must be >= dateOfTravel)
  timeFrom: string;     // HH:mm
  timeTo: string;       // HH:mm
  fromLocation: string;
  toLocation: string;
  officialDescription?: string;
  goods?: string;

  /** NEW (optional): travel with officer + details */
  travelWithOfficer?: boolean;
  officerName?: string;
  officerId?: string;
  officerPhone?: string;
};

export async function createUsageRequest(payload: CreateUsageRequestDto) {
  const { data } = await http.post("/usage-requests", payload);
  return unwrapApi<UsageRequest>(data);
}

/** Applicant’s own, paged */
export async function listMyRequests(employeeId: string, page = 0, size = 200) {
  const { data } = await http.get(`/usage-requests/my`, { params: { employeeId, page, size } });
  return unwrapApi<Page<UsageRequest>>(data);
}

/** (Optional) All requests – supports both /all and paged / */
export async function listAllRequests() {
  try {
    const { data } = await http.get("/usage-requests/all");
    return unwrapApi<UsageRequest[]>(data);
  } catch {
    const { data } = await http.get("/usage-requests");
    const body = unwrapApi<any>(data);
    if (Array.isArray(body)) return body as UsageRequest[];
    if (body?.content && Array.isArray(body.content)) return body.content as UsageRequest[];
    return body as UsageRequest[];
  }
}

export async function listByStatus(status: RequestStatus) {
  const { data } = await http.get(`/usage-requests/status/${status}`);
  return unwrapApi<UsageRequest[]>(data);
}

export async function getRequest(id: number) {
  const { data } = await http.get(`/usage-requests/${id}`);
  return unwrapApi<UsageRequest>(data);
}

export async function getPrintDto(id: number) {
  const { data } = await http.get(`/usage-requests/${id}/print`);
  return unwrapApi<any>(data);
}

/* =========================
   Approvals (HOD / MGMT)
   ========================= */
export const hodApprove = async (id: number, remarks?: string) =>
  unwrapApi<UsageRequest>((await http.post(`/usage-requests/${id}/hod/approve`, { remarks })).data);

export const hodReject = async (id: number, remarks?: string) =>
  unwrapApi<UsageRequest>((await http.post(`/usage-requests/${id}/hod/reject`, { remarks })).data);

export const mgmtApprove = async (id: number, remarks?: string) =>
  unwrapApi<UsageRequest>((await http.post(`/usage-requests/${id}/mgmt/approve`, { remarks })).data);

export const mgmtReject = async (id: number, remarks?: string) =>
  unwrapApi<UsageRequest>((await http.post(`/usage-requests/${id}/mgmt/reject`, { remarks })).data);

/* =========================
   Assignment (In-charge)
   ========================= */
export type AssignPayload = {
  vehicleId?: number | null;
  vehicleNumber?: string | null;
  driverId?: number | null;
  driverName?: string | null;
  driverPhone?: string | null;
  pickupAt?: string | Date | null;
  expectedReturnAt?: string | Date | null;
  instructions?: string | null;
  additionalRequestIds?: number[]; // optional
};

export async function assignVehicle(id: number, payload: AssignPayload) {
  const body = {
    ...payload,
    pickupAt: payload.pickupAt instanceof Date ? payload.pickupAt.toISOString() : payload.pickupAt,
    expectedReturnAt:
      payload.expectedReturnAt instanceof Date ? payload.expectedReturnAt.toISOString() : payload.expectedReturnAt,
  };
  const { data } = await http.post(`/usage-requests/${id}/assign`, body);
  return unwrapApi<UsageRequest>(data);
}

/* =========================
   Gate (GATE role)
   ========================= */
type ExitCompat = {
  exitOdometer?: number | null;
  exitManifest?: any[] | null;
  odometerStartKm?: number | null;
  fuelBefore?: number | null;
  remarks?: string | null;
};

type EntryCompat = {
  entryOdometer?: number | null;
  entryManifest?: any[] | null;
  odometerEndKm?: number | null;
  fuelAfter?: number | null;
  remarks?: string | null;
};

export async function gateExit(id: number, p: ExitCompat) {
  const body: any = {};
  if (typeof p.exitOdometer === "number") body.exitOdometer = p.exitOdometer;
  if (typeof p.odometerStartKm === "number" && body.exitOdometer == null) body.exitOdometer = p.odometerStartKm;

  const notes: any[] = [];
  if (p.remarks) notes.push({ type: "note", value: String(p.remarks) });
  if (typeof p.fuelBefore === "number") notes.push({ type: "fuelBeforePct", value: p.fuelBefore });
  if (Array.isArray(p.exitManifest) && p.exitManifest.length) notes.push(...p.exitManifest);
  if (notes.length) body.exitManifest = notes;

  const { data } = await http.post(`/usage-requests/${id}/gate/exit`, body);
  return unwrapApi<UsageRequest>(data);
}

export async function gateEntry(id: number, p: EntryCompat) {
  const body: any = {};
  if (typeof p.entryOdometer === "number") body.entryOdometer = p.entryOdometer;
  if (typeof p.odometerEndKm === "number" && body.entryOdometer == null) body.entryOdometer = p.odometerEndKm;

  const notes: any[] = [];
  if (p.remarks) notes.push({ type: "note", value: String(p.remarks) });
  if (typeof p.fuelAfter === "number") notes.push({ type: "fuelAfterPct", value: p.fuelAfter });
  if (Array.isArray(p.entryManifest) && p.entryManifest.length) notes.push(...p.entryManifest);
  if (notes.length) body.entryManifest = notes;

  const { data } = await http.post(`/usage-requests/${id}/gate/entry`, body);
  return unwrapApi<UsageRequest>(data);
}

/* =========================
   Metrics (Dashboard)
   ========================= */
export type MetricsDto = {
  total: number;
  byStatus: Record<string, number>;
  nextDayTop10: Array<{
    id: number;
    requestCode: string;
    assignedVehicleNumber?: string | null;
    assignedDriverName?: string | null;
    scheduledPickupAt?: string | null;
  }>;
};

export async function metrics() {
  const { data } = await http.get("/usage-requests/metrics");
  return unwrapApi<MetricsDto>(data);
}
