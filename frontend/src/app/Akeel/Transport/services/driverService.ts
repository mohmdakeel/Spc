export type DriverStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface Driver {
  employeeId: string;
  name: string;
  phone?: string;
  email?: string;
  licenseNumber: string;
  licenseExpiryDate?: string;     // "yyyy-MM-dd" string
  drivingExperience?: number;
  status?: DriverStatus;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  deletedBy?: string;
  deletedAt?: string;
  previousData?: Record<string, any>;
}

// Fetch all drivers (active)
export async function fetchDrivers(): Promise<Driver[]> {
  const res = await fetch("/api/drivers", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch drivers");
  return await res.json();
}

// Fetch all deleted drivers
export async function fetchDeletedDrivers(): Promise<Driver[]> {
  const res = await fetch("/api/drivers/deleted", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch deleted drivers");
  return await res.json();
}

// Fetch full driver details (includes previousData)
export async function fetchDriverWithPreviousData(employeeId: string) {
  const res = await fetch(`/api/drivers/${employeeId}`);
  if (!res.ok) throw new Error("Failed to fetch driver details");
  return await res.json(); // { driver: {...}, previousData: {...} }
}

// Add driver
export async function addDriver(driver: Driver) {
  const res = await fetch("/api/drivers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(driver),
  });
  if (!res.ok) throw new Error("Failed to add driver");
  return await res.json();
}

// Update driver
export async function updateDriver(employeeId: string, driver: Driver) {
  const res = await fetch(`/api/drivers/${employeeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(driver),
  });
  if (!res.ok) throw new Error("Failed to update driver");
  return await res.json();
}

// Delete driver
export async function deleteDriver(employeeId: string) {
  const res = await fetch(`/api/drivers/${employeeId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete driver");
}
