import { useState } from 'react';
import { toast } from 'react-toastify';
import SettingsPageShell, { simulateSave } from '../../components/settings/SettingsPageShell';
import SectionCard from '../../components/settings/SectionCard';
import RadioGroup from '../../components/settings/RadioGroup';
import SelectField from '../../components/settings/SelectField';
import ToggleSwitch from '../../components/settings/ToggleSwitch';
import {
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from '../../components/settings/settingsDummyData';

const THEME_OPTIONS = [
  { value: 'Light', label: 'Light', description: 'Bright interface for daytime use.' },
  { value: 'Dark', label: 'Dark', description: 'Reduced glare for low-light environments.' },
  { value: 'System', label: 'System', description: 'Match your device settings automatically.' },
];

const TIME_FORMAT_OPTIONS = ['12 Hour', '24 Hour'];

const DEFAULT_APPEARANCE = {
  theme: 'Light',
  language: 'English (US)',
  timezone: 'Pacific Time (PT)',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12 Hour',
  largeText: false,
  highContrast: false,
  reduceAnimations: false,
};

export default function AppearanceSettings() {
  const [settings, setSettings] = useState(DEFAULT_APPEARANCE);
  const [saving, setSaving] = useState(false);

  const updateField = (field) => (event) => {
    setSettings((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await simulateSave();
      toast.success('Appearance preferences saved successfully.');
    } catch {
      toast.error('Unable to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_APPEARANCE);
    toast.info('Preferences reset to default.');
  };

  return (
    <SettingsPageShell
      title="Appearance & Language"
      description="Customize how CareerBridge looks and displays information."
      onSave={handleSave}
      onCancel={handleReset}
      saveLabel="Save Preferences"
      cancelLabel="Reset to Default"
      saving={saving}
    >
      <SectionCard title="Theme">
        <RadioGroup
          name="theme"
          value={settings.theme}
          onChange={(value) => setSettings((current) => ({ ...current, theme: value }))}
          options={THEME_OPTIONS}
        />
      </SectionCard>

      <SectionCard title="Language & Region">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            id="language"
            label="Language"
            value={settings.language}
            onChange={updateField('language')}
            options={LANGUAGE_OPTIONS}
          />
          <SelectField
            id="timezone"
            label="Timezone"
            value={settings.timezone}
            onChange={updateField('timezone')}
            options={TIMEZONE_OPTIONS}
          />
          <SelectField
            id="dateFormat"
            label="Date Format"
            value={settings.dateFormat}
            onChange={updateField('dateFormat')}
            options={DATE_FORMAT_OPTIONS}
          />
          <SelectField
            id="timeFormat"
            label="Time Format"
            value={settings.timeFormat}
            onChange={updateField('timeFormat')}
            options={TIME_FORMAT_OPTIONS}
          />
        </div>
      </SectionCard>

      <SectionCard title="Accessibility">
        <ToggleSwitch
          id="large-text"
          label="Large Text"
          checked={settings.largeText}
          onChange={(value) => setSettings((current) => ({ ...current, largeText: value }))}
        />
        <ToggleSwitch
          id="high-contrast"
          label="High Contrast"
          checked={settings.highContrast}
          onChange={(value) => setSettings((current) => ({ ...current, highContrast: value }))}
        />
        <ToggleSwitch
          id="reduce-animations"
          label="Reduce Animations"
          checked={settings.reduceAnimations}
          onChange={(value) => setSettings((current) => ({ ...current, reduceAnimations: value }))}
        />
      </SectionCard>
    </SettingsPageShell>
  );
}
