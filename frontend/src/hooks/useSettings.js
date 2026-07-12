import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  changeUserPassword,
  deleteUserAccount,
  updateAccount,
} from '../services/settingsService';
import { dashboardKeys } from './useDashboard';

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccount,
    onSuccess: () => {
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
