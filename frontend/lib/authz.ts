// lib/authz.ts - Enhanced version
export function pickHomeFor(user: any): string {
  if (!user || !user.roles) {
    return '/login';
  }

  const roles = user.roles.map((r: string) => r.toUpperCase());
  
  // Check if user has access to main dashboard (ADMIN only)
  if (roles.includes('ADMIN')) {
    return '/maindashboard';
  }
  
  // Check if user has transport-specific roles
  const transportRoles = ['TRANSPORT_MANAGER', 'TRANSPORT_SUPERVISOR', 'TRANSPORT_STAFF', 'DRIVER'];
  const hasTransportRole = roles.some((r: string) => 
    transportRoles.includes(r) || r.includes('TRANSPORT')
  );
  
  // Check if user has auth service roles
  const authRoles = ['HR', 'HOD', 'GM', 'MANAGER'];
  const hasAuthRole = roles.some((r: string) => authRoles.includes(r));
  
  // Priority routing based on roles
  if (hasTransportRole && !hasAuthRole) {
    // Only transport roles - go to transport dashboard
    return '/Akeel/Transport';
  } else if (hasAuthRole && !hasTransportRole) {
    // Only auth roles - go to auth dashboard
    return '/dashboard';
  } else if (hasTransportRole && hasAuthRole) {
    // Both roles - check primary role or go to main dashboard
    if (roles.includes('HR') || roles.includes('ADMIN')) {
      return '/dashboard';
    } else {
      return '/Akeel/Transport';
    }
  }
  
  // Default fallback
  return '/dashboard';
}

// Helper function to check service access
export function hasServiceAccess(user: any, service: 'auth' | 'transport'): boolean {
  if (!user?.roles) return false;
  
  const roles = user.roles.map((r: string) => r.toUpperCase());
  
  if (service === 'auth') {
    const authRoles = ['ADMIN', 'HR', 'HOD', 'GM', 'MANAGER'];
    return roles.some((r: string) => authRoles.includes(r));
  }
  
  if (service === 'transport') {
    const transportRoles = ['ADMIN', 'TRANSPORT_MANAGER', 'TRANSPORT_SUPERVISOR', 'TRANSPORT_STAFF', 'DRIVER'];
    return roles.some((r: string) => 
      transportRoles.includes(r) || r.includes('TRANSPORT')
    );
  }
  
  return false;
}