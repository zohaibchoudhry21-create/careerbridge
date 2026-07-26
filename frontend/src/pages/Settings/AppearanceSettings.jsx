import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { useLanguageSwitcher } from '../../hooks/useLanguageSwitcher';
import SettingsPageShell, { simulateSave } from '../../components/settings/SettingsPageShell';
import SectionCard from '../../components/settings/SectionCard';
import RadioGroup from '../../components/settings/RadioGroup';
import SelectField from '../../components/settings/SelectField';
import ToggleSwitch from '../../components/settings/ToggleSwitch';
import { DATE_FORMAT_OPTIONS } from '../../components/settings/settingsDummyData';
import { DEFAULT_LANGUAGE_PREFERENCE } from '../../i18n/languagePreference';

const DEFAULT_APPEARANCE = {
  theme: 'Light',
  language: DEFAULT_LANGUAGE_PREFERENCE,
  timezone: 'Pacific Time (PT)',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12 Hour',
  largeText: false,
  highContrast: false,
  reduceAnimations: false,
};

export default function AppearanceSettings() {
  const { t } = useTranslation('settings');
  const { user } = useAuth();
  const { setLanguageByPreference } = useLanguageSwitcher();
  const [settings, setSettings] = useState(DEFAULT_APPEARANCE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.languagePreference) return;
    setSettings((current) => ({
      ...current,
      language: user.languagePreference,
    }));
  }, [user?.languagePreference]);

  const themeOptions = useMemo(
    () => [
      {
        value: 'Light',
        label: t('appearance.theme.light'),
        description: t('appearance.theme.lightDescription'),
      },
      {
        value: 'Dark',
        label: t('appearance.theme.dark'),
        description: t('appearance.theme.darkDescription'),
      },
      {
        value: 'System',
        label: t('appearance.theme.system'),
        description: t('appearance.theme.systemDescription'),
      },
    ],
    [t]
  );

  const languageOptions = useMemo(
    () => [
      { value: 'en-US', label: t('appearance.languageRegion.languages.enUS') },
      { value: 'en-GB', label: t('appearance.languageRegion.languages.enGB') },
      { value: 'es', label: t('appearance.languageRegion.languages.es') },
      { value: 'ur', label: t('appearance.languageRegion.languages.ur') },
    ],
    [t]
  );

  const timezoneOptions = useMemo(
    () => [
      { value: 'Pacific Time (PT)', label: t('appearance.languageRegion.timezones.pacific') },
      { value: 'Eastern Time (ET)', label: t('appearance.languageRegion.timezones.eastern') },
      { value: 'Central Time (CT)', label: t('appearance.languageRegion.timezones.central') },
      { value: 'UTC', label: t('appearance.languageRegion.timezones.utc') },
      { value: 'GMT', label: t('appearance.languageRegion.timezones.gmt') },
    ],
    [t]
  );

  const timeFormatOptions = useMemo(
    () => [
      { value: '12 Hour', label: t('appearance.languageRegion.timeFormats.12h') },
      { value: '24 Hour', label: t('appearance.languageRegion.timeFormats.24h') },
    ],
    [t]
  );

  const updateField = (field) => (event) => {
    setSettings((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleLanguageChange = async (event) => {
    const preference = event.target.value;
    setSettings((current) => ({ ...current, language: preference }));
    await setLanguageByPreference(preference);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await simulateSave();
      toast.success(t('appearance.toasts.saveSuccess'));
    } catch {
      toast.error(t('appearance.toasts.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_APPEARANCE);
    toast.info(t('appearance.toasts.reset'));
  };

  return (
    <SettingsPageShell
      title={t('appearance.title')}
      description={t('appearance.description')}
      onSave={handleSave}
      onCancel={handleReset}
      saveLabel={t('appearance.savePreferences')}
      cancelLabel={t('appearance.resetToDefault')}
      saving={saving}
    >
      <SectionCard title={t('appearance.theme.title')} icon="palette" color="mode">
        <RadioGroup
          name="theme"
          value={settings.theme}
          onChange={(value) => setSettings((current) => ({ ...current, theme: value }))}
          options={themeOptions}
        />
      </SectionCard>

      <SectionCard title={t('appearance.languageRegion.title')} icon="language" color="role">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            id="language"
            label={t('appearance.languageRegion.language')}
            value={settings.language}
            onChange={handleLanguageChange}
            options={languageOptions}
          />
          <SelectField
            id="timezone"
            label={t('appearance.languageRegion.timezone')}
            value={settings.timezone}
            onChange={updateField('timezone')}
            options={timezoneOptions}
          />
          <SelectField
            id="dateFormat"
            label={t('appearance.languageRegion.dateFormat')}
            value={settings.dateFormat}
            onChange={updateField('dateFormat')}
            options={DATE_FORMAT_OPTIONS}
          />
          <SelectField
            id="timeFormat"
            label={t('appearance.languageRegion.timeFormat')}
            value={settings.timeFormat}
            onChange={updateField('timeFormat')}
            options={timeFormatOptions}
          />
        </div>
      </SectionCard>

      <SectionCard title={t('appearance.accessibility.title')} icon="accessibility_new" color="focus">
        <ToggleSwitch
          id="large-text"
          label={t('appearance.accessibility.largeText')}
          checked={settings.largeText}
          onChange={(value) => setSettings((current) => ({ ...current, largeText: value }))}
        />
        <ToggleSwitch
          id="high-contrast"
          label={t('appearance.accessibility.highContrast')}
          checked={settings.highContrast}
          onChange={(value) => setSettings((current) => ({ ...current, highContrast: value }))}
        />
        <ToggleSwitch
          id="reduce-animations"
          label={t('appearance.accessibility.reduceAnimations')}
          checked={settings.reduceAnimations}
          onChange={(value) => setSettings((current) => ({ ...current, reduceAnimations: value }))}
        />
      </SectionCard>
    </SettingsPageShell>
  );
}
