import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '../services/dashboardService';

export const dashboardKeys = {
  all: ['dashboard'],
  overview: ['dashboard', 'overview'],
};

export function useDashboardOverview() {
  return useQuery({
    queryKey: dashboardKeys.overview,
    queryFn: fetchDashboard,
    staleTime: 60_000,
  });
}
