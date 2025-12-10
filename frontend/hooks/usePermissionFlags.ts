import { useAuth } from './useAuth';

export const usePermissionFlags = () => {
  const { can } = useAuth();

  return {
    canRead: can('READ'),
    canCreate: can('CREATE'),
    canUpdate: can('UPDATE'),
    canDelete: can('DELETE'),
    canPrint: can('PRINT'),
  };
};
