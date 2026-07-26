import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAuth from './useAuth';
import {
  changeUserPassword,
  deleteUserAccount,
  updateAccount,
} from '../services/settingsService';
import { dashboardKeys } from './useDashboard';

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: updateAccount,
    onSuccess: (data) => {
      if (data?.user) {
        updateUser(data.user);
      }
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changeUserPassword,
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: deleteUserAccount,
  });
}
