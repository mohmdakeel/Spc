// types.ts
export interface User {
  id?: number;
  username: string;
  email: string;
  fullName: string;
  department?: string;
  imageUrl?: string;
  roles: string[];
  permissions: string[];
  epfNo?: string;
}


export interface Registration {
  id?: number;
  epfNo: string;
  attendanceNo?: string;
  nameWithInitials?: string;
  surname?: string;
  fullName: string;
  nicNo: string;
  dateOfBirth?: string;
  civilStatus?: string;
  gender?: string;
  race?: string;
  religion?: string;
  bloodGroup?: string;
  permanentAddress?: string;
  district?: string;
  mobileNo?: string;
  personalEmail?: string;
  cardStatus?: string;
  imageUrl?: string;
  currentAddress?: string;
  dsDivision?: string;
  residencePhone?: string;
  emergencyContact?: string;
  workingStatus?: string;
  department?: string;
}

export interface AuditLog {
  id?: number;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  atTime: string;
}

export interface Permission {
  id: number;
  code: string;
  description: string;
}


