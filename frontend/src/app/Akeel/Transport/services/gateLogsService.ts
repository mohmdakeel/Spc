import http, { unwrapApi } from './http';

export type VisitorVehicle = {
  id: number;
  plate: string;
  driverName?: string;
  company?: string;
  purpose?: string;
  timeIn: string;
  timeOut?: string | null;
};

export type CompanyVehicle = {
  id: number;
  vehicleNumber: string;
  driverName?: string;
  department?: string;
  purpose?: string;
  timeIn: string;
  timeOut?: string | null;
};

// ---------- Visitors ----------
export async function listVisitorVehicles(q?: string) {
  const { data } = await http.get('/gate/visitors', { params: { q } });
  return unwrapApi<VisitorVehicle[]>(data);
}

export async function createVisitorVehicle(payload: {
  plate: string;
  driverName?: string;
  company?: string;
  purpose?: string;
}) {
  const body = { ...payload, plate: payload.plate.trim().toUpperCase() };
  const { data } = await http.post('/gate/visitors', body);
  return unwrapApi<VisitorVehicle>(data);
}

export async function exitVisitorVehicle(id: number) {
  const { data } = await http.post(`/gate/visitors/${id}/exit`);
  return unwrapApi<VisitorVehicle>(data);
}

// ---------- Company ----------
export async function listCompanyVehicles(q?: string) {
  const { data } = await http.get('/gate/company-vehicles', { params: { q } });
  return unwrapApi<CompanyVehicle[]>(data);
}

export async function createCompanyVehicle(payload: {
  vehicleNumber: string;
  driverName?: string;
  department?: string;
  purpose?: string;
}) {
  const body = { ...payload, vehicleNumber: payload.vehicleNumber.trim().toUpperCase() };
  const { data } = await http.post('/gate/company-vehicles', body);
  return unwrapApi<CompanyVehicle>(data);
}

export async function exitCompanyVehicle(id: number) {
  const { data } = await http.post(`/gate/company-vehicles/${id}/exit`);
  return unwrapApi<CompanyVehicle>(data);
}
