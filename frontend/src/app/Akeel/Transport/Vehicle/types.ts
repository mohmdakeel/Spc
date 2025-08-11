export type VehicleStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "REMOVED";

export interface Vehicle {
  id: number;
  vehicleNumber: string;
  vehicleType?: string;
  brand?: string;
  model?: string;
  chassisNumber?: string;
  engineNumber?: string;
  manufactureDate?: string; // ISO
  totalKmDriven?: number;
  fuelEfficiency?: number;
  presentCondition?: string;
  status?: VehicleStatus;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  deletedBy?: string;
  deletedAt?: string;
}

export interface VehicleHistory {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  timestamp: string; // ISO
  previousData: string | null; // JSON string from backend or null
}
