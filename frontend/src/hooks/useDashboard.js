import { useQuery } from '@tanstack/react-query';
import { fetchDashboard, fetchJobMatches } from '../services/dashboardService';

export const dashboardKeys = {
  all: ['dashboard'],
  overview: ['dashboard', 'overview'],
  jobs: ['dashboard', 'jobs'],
};

export function useDashboardOverview() {
  return useQuery({
    queryKey: dashboardKeys.overview,
    queryFn: fetchDashboard,
    staleTime: 60_000,
  });
}

export function useJobMatches() {
  return useQuery({
    queryKey: dashboardKeys.jobs,
    queryFn: fetchJobMatches,
    staleTime: 60_000,
  });
}
