import { useQuery } from '@tanstack/react-query';
import { fetchUserProfile } from '../services/profileService';

export const profileKeys = {
  all: ['profile'],
  me: () => [...profileKeys.all, 'me'],
};

export function useUserProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: fetchUserProfile,
    select: (data) => data?.profile,
  });
}

export default useUserProfile;
