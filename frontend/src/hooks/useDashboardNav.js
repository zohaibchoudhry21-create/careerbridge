import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_NAV_DEFS, QUICK_ACTION_DEFS } from '../components/dashboard/dashboardConstants';

export function useDashboardNavItems() {
  const { t } = useTranslation('common');

  return useMemo(
    () =>
      DASHBOARD_NAV_DEFS.map((item) => ({
        ...item,
        label: t(`sidebar.${item.id}`),
      })),
    [t]
  );
}

export function useQuickActions() {
  const { t } = useTranslation('dashboard');

  return useMemo(
    () =>
      QUICK_ACTION_DEFS.map((action) => ({
        ...action,
        label: t(`quickActions.${action.id}`),
      })),
    [t]
  );
}
