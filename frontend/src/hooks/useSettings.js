import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from './useAuth';
import {
  changeUserPassword,
  deleteUserAccount,
  getUserSessions,
  revokeOtherUserSessions,
  revokeUserSession,
  updateAccount,
} from '../services/settingsService';
import { dashboardKeys } from './useDashboard';

export const sessionKeys = {
  all: ['settings', 'sessions'],
};

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeUserPassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: deleteUserAccount,
  });
}

export function useSessions() {
  return useQuery({
    queryKey: sessionKeys.all,
    queryFn: async () => {
      const data = await getUserSessions();
      return data?.sessions ?? [];
    },
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeUserSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeOtherUserSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}
