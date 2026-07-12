import { useState } from 'react';
import { toast } from 'react-toastify';
import SettingsPageShell, { simulateSave } from '../../components/settings/SettingsPageShell';
import SectionCard from '../../components/settings/SectionCard';
import RadioGroup from '../../components/settings/RadioGroup';
import ToggleSwitch from '../../components/settings/ToggleSwitch';
import SelectField from '../../components/settings/SelectField';
import { RESUME_VISIBILITY_OPTIONS } from '../../components/settings/settingsDummyData';

const VISIBILITY_OPTIONS = [
  { value: 'Public', label: 'Public', description: 'Anyone can view your profile.' },
  { value: 'Recruiters Only', label: 'Recruiters Only', description: 'Only verified recruiters can view your profile.' },
  { value: 'Private', label: 'Private', description: 'Only you can view your profile.' },
];

export default function PrivacySettings() {
  const [profileVisibility, setProfileVisibility] = useState('Recruiters Only');
  const [resumeVisibility, setResumeVisibility] = useState('Recruiters Only');
  const [showInSearch, setShowInSearch] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);
  const [allowRecruiterContact, setAllowRecruiterContact] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(true);
  const [hideEmail, setHideEmail] = useState(false);
  const [hidePhone, setHidePhone] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await simulateSave();
      toast.success('Privacy settings saved successfully.');
    } catch {
      toast.error('Unable to save privacy settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    toast.info('Changes discarded.');
  };

  return (
    <SettingsPageShell
      title="Privacy Settings"
      description="Control your profile visibility, data sharing, and resume access."
      onSave={handleSave}
      onCancel={handleCancel}
      saving={saving}
    >
      <SectionCard title="Profile Visibility">
        <RadioGroup
          name="profile-visibility"
          value={profileVisibility}
          onChange={setProfileVisibility}
          options={VISIBILITY_OPTIONS}
        />
      </SectionCard>

      <SectionCard title="Privacy Options">
        <ToggleSwitch
          id="show-search"
          label="Show profile in search"
          checked={showInSearch}
          onChange={setShowInSearch}
        />
        <ToggleSwitch
          id="show-online"
          label="Show online status"
          checked={showOnlineStatus}
          onChange={setShowOnlineStatus}
        />
        <ToggleSwitch
          id="recruiter-contact"
          label="Allow recruiters to contact me"
          checked={allowRecruiterContact}
          onChange={setAllowRecruiterContact}
        />
        <ToggleSwitch
          id="analytics"
          label="Allow anonymous analytics"
          description="Help improve CareerBridge with anonymous usage data."
          checked={allowAnalytics}
          onChange={setAllowAnalytics}
        />
        <ToggleSwitch
          id="hide-email"
          label="Hide email"
          checked={hideEmail}
          onChange={setHideEmail}
        />
        <ToggleSwitch
          id="hide-phone"
          label="Hide phone number"
          checked={hidePhone}
          onChange={setHidePhone}
        />
      </SectionCard>

      <SectionCard title="Resume Visibility">
        <SelectField
          id="resume-visibility"
          label="Who can view your resume"
          value={resumeVisibility}
          onChange={(event) => setResumeVisibility(event.target.value)}
          options={RESUME_VISIBILITY_OPTIONS}
        />
      </SectionCard>
    </SettingsPageShell>
  );
}
