import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SETTINGS_DASHBOARD_CARD_DEFS } from '../components/settings/settingsConstants';

export function useSettingsCards() {
  const { t } = useTranslation('settings');

  return useMemo(
    () =>
      SETTINGS_DASHBOARD_CARD_DEFS.map((card) => ({
        ...card,
        title: t(`hub.cards.${card.id}.title`),
        description: t(`hub.cards.${card.id}.description`),
      })),
    [t]
  );
}
