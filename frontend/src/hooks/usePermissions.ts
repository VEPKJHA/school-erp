import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { hasPermission, hasRole, user } = useAuth();
  return {
    hasPermission,
    hasRole,
    user,
  };
};

export default usePermissions;
