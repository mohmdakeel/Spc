/* ===== Basics ===== */
export type EntityId = number | string;
export type ISODateString = string;
export type ISODateTimeString = string;

/* ===== Statuses ===== */
export type DriverStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type VehicleStatus = "AVAILABLE" | "IN_SERVICE" | "UNDER_REPAIR" | "RETIRED";

export type RequestStatus =
  | "PENDING_HOD"
  | "REJECTED"
  | "PENDING_MANAGEMENT"
  | "APPROVED"
  | "SCHEDULED"
  | "DISPATCHED"
  | "RETURNED";

/* ===== API Shapes ===== */
export interface ApiResponse<T> {
  ok: boolean;
  message?: string;
  data: T;
}

export interface PaginationResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
export type Page<T> = PaginationResponse<T>;

/* ===== Shared audit fields ===== */
export interface AuditFields {
  createdBy?: string | null;
  createdAt?: ISODateTimeString | null;
  updatedBy?: string | null;
  updatedAt?: ISODateTimeString | null;
  deletedBy?: string | null;
  deletedAt?: ISODateTimeString | null;
}

/* ===== Entities ===== */
export interface Vehicle extends AuditFields {
  id: EntityId;
  vehicleNumber: string;
  vehicleType: string;
  brand?: string | null;
  model?: string | null;
  chassisNumber?: string | null;
  engineNumber?: string | null;
  manufactureDate?: ISODateString | null;
  /** Registered odometer at onboarding */
  registeredKm?: number | null;
  totalKmDriven?: number | null;
  fuelEfficiency?: number | null; // km/l
  presentCondition?: string | null;
  status?: VehicleStatus | null;
}

/* NEW: VehicleImage */
export interface VehicleImage {
  id: EntityId;
  url: string;
  sortOrder: number;                  // 0 = cover
  createdAt?: ISODateTimeString | null;
}

export interface Driver extends AuditFields {
  employeeId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  licenseNumber?: string | null;
  licenseExpiryDate?: ISODateString | null;
  drivingExperience?: number | null; // years
  status?: DriverStatus | null;
}

export interface UsageRequest {
  id: number;
  requestCode: string;

  // Applicant
  applicantName: string;
  employeeId: string;
  department: string;

  /** NEW: date applicant applied (yyyy-mm-dd) */
  appliedDate?: ISODateString | null;

  // Travel
  dateOfTravel: ISODateString;
  returnDate?: ISODateString | null;
  timeFrom: string; // HH:mm
  timeTo: string;   // HH:mm
  fromLocation: string;
  toLocation: string;
  officialDescription?: string | null;
  goods?: string | null;
  overnight?: boolean; // backend may include

  /** NEW: travel with officer */
  travelWithOfficer?: boolean | null;
  officerName?: string | null;
  officerId?: string | null;
  officerPhone?: string | null;

  // Status
  status: RequestStatus;

  // Assignment
  assignedVehicleId?: number | null;
  assignedVehicleNumber?: string | null;
  assignedDriverId?: number | null;
  assignedDriverName?: string | null;
  assignedDriverPhone?: string | null;

  // Schedule
  scheduledPickupAt?: ISODateTimeString | null;
  scheduledReturnAt?: ISODateTimeString | null;

  // Gate & trip metrics
  gateExitAt?: ISODateTimeString | null;
  gateEntryAt?: ISODateTimeString | null;
  exitOdometer?: number | null;
  entryOdometer?: number | null;

  // UI-only aliases
  odometerStartKm?: number | null;
  odometerEndKm?: number | null;
  fuelBefore?: number | null;
  fuelAfter?: number | null;
  gateRemarks?: string | null;

  // Audit
  createdBy?: string | null;
  createdAt?: ISODateTimeString | null;
  updatedBy?: string | null;
  updatedAt?: ISODateTimeString | null;
}

/* ===== History (optional helpers) ===== */
export type HistoryAction = "Created" | "Updated" | "Deleted";

export interface HistoryRecordDto {
  id: EntityId;
  entityType: string;
  entityId: EntityId;
  action: string;
  performedBy?: string | null;
  timestamp: ISODateTimeString;
  previousJson?: unknown | null;
  newJson?: unknown | null;
}

export interface ChangeHistory {
  id: EntityId;
  entityType: "Vehicle" | "Driver";
  entityId: EntityId;
  action: HistoryAction;
  previousData?: unknown | null;
  newData?: unknown | null;
  performedBy?: string | null;
  timestamp: ISODateTimeString;
}

export enum ChangeType {
  ADDED = "ADDED",
  REMOVED = "REMOVED",
  CHANGED = "CHANGED",
  ERROR = "ERROR",
}
export interface ChangeItem {
  field: string;
  beforeVal: unknown;
  afterVal: unknown;
  changeType: ChangeType;
}

export interface CompareResult {
  entityType: "Vehicle" | "Driver";
  entityId: EntityId;
  action: HistoryAction;
  comparedAgainst: string;
  performedBy?: string | null;
  timestamp: ISODateTimeString;
  changes: ChangeItem[];
}

export const normalizeHistoryDto = (dto: HistoryRecordDto): ChangeHistory => ({
  id: dto.id,
  entityType: dto.entityType === "Vehicle" || dto.entityType === "Driver" ? dto.entityType : "Vehicle",
  entityId: dto.entityId,
  action: dto.action === "Created" || dto.action === "Updated" || dto.action === "Deleted" ? dto.action : "Updated",
  previousData: dto.previousJson ?? null,
  newData: dto.newJson ?? null,
  performedBy: dto.performedBy ?? null,
  timestamp: dto.timestamp,
});
