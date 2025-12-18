// lib/authz.ts

type UserWithRoles = {
  roles?: string[];
};

// figure out which page user should land on after login
export function pickHomeFor(user: UserWithRoles | null | undefined): string {
  if (!user || !user.roles) {
    return '/login';
  }

  const roles = user.roles.map((r: string) => r.toUpperCase());
  const isAdmin = roles.includes('ADMIN');
  const managementRoles = ['HRD', 'GM', 'CHAIRMAN'];

  // HODs land directly on their dashboard
  if (roles.includes('HOD') && !isAdmin) {
    return '/Akeel/Hod';
  }

  // HRD / GM / Chairman go straight to management workspace
  if (!isAdmin && managementRoles.some((role) => roles.includes(role))) {
    return '/Akeel/Management';
  }

  // Gate security officers
  if (!isAdmin && roles.includes('GATE_SECURITY')) {
    return '/Akeel/Gate';
  }

  // Vehicle in-charge panel
  if (!isAdmin && roles.includes('VEHICLE_INCHARGE')) {
    return '/Akeel/Incharge';
  }

  // Staff / applicants
  if (!isAdmin && roles.includes('STAFF')) {
    return '/Akeel/Applicant';
  }

  // Admins and "multi-service" people go to the combined dashboard
  if (
    roles.includes('ADMIN') ||
    (hasServiceAccess(user, 'auth') && hasServiceAccess(user, 'transport'))
  ) {
    return '/maindashboard';
  }

  // Transport-only users
  if (hasServiceAccess(user, 'transport')) {
    return '/Akeel/Transport'; // your custom transport dashboard
  }

  // HR / GM / etc -> auth dashboard
  if (hasServiceAccess(user, 'auth')) {
    return '/dashboard';
  }

  // default fallback
  return '/maindashboard';
}

// check if user can access a service area
export function hasServiceAccess(user: UserWithRoles | null | undefined, service: 'auth' | 'transport'): boolean {
  if (!user?.roles) return false;
  
  const roles = user.roles.map((r: string) => r.toUpperCase());

  if (service === 'auth') {
    const authRoles = ['ADMIN', 'HR', 'HRD', 'HOD', 'GM', 'CHAIRMAN', 'STAFF'];
    return roles.some((r: string) => authRoles.includes(r));
  }

  if (service === 'transport') {
    const transportRoles = [
      'ADMIN',
      'TRANSPORT_ADMIN',
      'TRANSPORT',
      'VEHICLE_INCHARGE',
      'GATE_SECURITY',
    ];
    return roles.some((r: string) => transportRoles.includes(r));
  }

  return false;
}

// ("Where does this user mainly belong?")
export function getUserPrimaryService(user: UserWithRoles | null | undefined): 'auth' | 'transport' | 'both' | 'none' {
  if (!user?.roles) return 'none';

  const hasAuth = hasServiceAccess(user, 'auth');
  const hasTransport = hasServiceAccess(user, 'transport');

  if (hasAuth && hasTransport) return 'both';
  if (hasAuth) return 'auth';
  if (hasTransport) return 'transport';
  return 'none';
}
