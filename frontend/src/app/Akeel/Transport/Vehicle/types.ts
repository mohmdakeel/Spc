export type VehicleStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "REMOVED";

export interface Vehicle {
  id?: number;                         // optional when creating
  vehicleNumber: string;
  vehicleType?: string | null;
  brand?: string | null;
  model?: string | null;
  chassisNumber?: string | null;       // unique
  engineNumber?: string | null;        // unique
  manufactureDate?: string | null;     // "yyyy-MM-dd" or ISO or null
  totalKmDriven?: number | null;
  fuelEfficiency?: number | null;
  presentCondition?: string | null;
  status?: VehicleStatus;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
  deletedBy?: string | null;
  deletedAt?: string | null;
}

export interface VehicleHistory {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  timestamp: string;
  previousData: string | null;
}
