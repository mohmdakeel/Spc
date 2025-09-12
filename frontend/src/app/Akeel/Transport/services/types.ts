// src/app/Akeel/Transport/services/types.ts

// ===== STATUSES =====
export type DriverStatus  = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type VehicleStatus = 'AVAILABLE' | 'IN_SERVICE' | 'UNDER_REPAIR' | 'RETIRED';

// allow number or string from backend
export type EntityId = number | string;

// ===== AUDIT FIELDS (shared) =====
export interface AuditFields {
  createdBy?: string | null;
  createdAt?: string | null;  // ISO string
  updatedBy?: string | null;
  updatedAt?: string | null;  // ISO string
  deletedBy?: string | null;
  deletedAt?: string | null;  // ISO string
}

// ===== ENTITIES =====
export interface Vehicle extends AuditFields {
  id: EntityId;
  vehicleNumber: string;
  vehicleType: string;
  brand?: string | null;
  model?: string | null;
  chassisNumber?: string | null;
  engineNumber?: string | null;
  manufactureDate?: string | null;   // yyyy-MM-dd or ISO
  totalKmDriven?: number | null;
  fuelEfficiency?: number | null;
  presentCondition?: string | null;
  status?: VehicleStatus | null;
}

export interface Driver extends AuditFields {
  employeeId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  licenseNumber: string;
  licenseExpiryDate?: string | null; // yyyy-MM-dd or ISO
  drivingExperience?: number | null;
  status: DriverStatus;
}

// ===== HISTORY =====
export type HistoryAction = 'Created' | 'Updated' | 'Deleted';

export interface ChangeHistory {
  id: EntityId;
  entityType: 'Vehicle' | 'Driver';
  entityId: EntityId;
  action: HistoryAction;
  previousData?: unknown | null;
  newData?: unknown | null;  // used by HistoryModal
  performedBy?: string | null;
  timestamp: string; // ISO
}

// Raw DTO from backend
export interface HistoryRecordDto {
  id: EntityId;
  entityType: string;
  entityId: EntityId;
  action: string;
  performedBy?: string | null;
  timestamp: string;  // ISO
  previousJson?: unknown | null;
  newJson?: unknown | null;
}

// (Optional) diff modeling
export enum ChangeType { ADDED='ADDED', REMOVED='REMOVED', CHANGED='CHANGED', ERROR='ERROR' }
export interface ChangeItem {
  field: string;
  beforeVal: unknown;
  afterVal: unknown;
  changeType: ChangeType;
}
export interface CompareResult {
  entityType: 'Vehicle' | 'Driver';
  entityId: EntityId;
  action: HistoryAction;
  comparedAgainst: string;
  performedBy?: string | null;
  timestamp: string;
  changes: ChangeItem[];
}

// ===== API WRAPPERS =====
export interface ApiResponse<T> { ok: boolean; message?: string; data: T; }
export interface PaginationResponse<T> {
  content: T[]; totalElements: number; totalPages: number; size: number; number: number;
}
