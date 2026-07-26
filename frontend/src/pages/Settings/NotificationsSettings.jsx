import { useState } from 'react';
import { toast } from 'react-toastify';
import SettingsPageShell, { simulateSave } from '../../components/settings/SettingsPageShell';
import SectionCard from '../../components/settings/SectionCard';
import ToggleSwitch from '../../components/settings/ToggleSwitch';

export default function NotificationsSettings() {
  const [emailResume, setEmailResume] = useState(true);
  const [emailInterview, setEmailInterview] = useState(true);
  const [emailJobs, setEmailJobs] = useState(true);
  const [emailWeekly, setEmailWeekly] = useState(false);
  const [pushMessages, setPushMessages] = useState(true);
  const [pushInterview, setPushInterview] = useState(true);
  const [pushProfileViews, setPushProfileViews] = useState(false);
  const [smsSecurity, setSmsSecurity] = useState(true);
  const [smsOtp, setSmsOtp] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await simulateSave();
      toast.success('Notification preferences saved successfully.');
    } catch {
      toast.error('Unable to save notification preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    toast.info('Changes discarded.');
  };

  return (
    <SettingsPageShell
      title="Notifications"
      description="Choose how and when CareerBridge contacts you."
      onSave={handleSave}
      onCancel={handleCancel}
      saveLabel="Save Preferences"
      saving={saving}
    >
      <SectionCard title="Email Notifications" icon="mail" color="settings">
        <ToggleSwitch
          id="email-resume"
          label="Resume Updates"
          checked={emailResume}
          onChange={setEmailResume}
        />
        <ToggleSwitch
          id="email-interview"
          label="Interview Invitations"
          checked={emailInterview}
          onChange={setEmailInterview}
        />
        <ToggleSwitch
          id="email-jobs"
          label="Job Alerts"
          checked={emailJobs}
          onChange={setEmailJobs}
        />
        <ToggleSwitch
          id="email-weekly"
          label="Weekly Summary"
          checked={emailWeekly}
          onChange={setEmailWeekly}
        />
      </SectionCard>

      <SectionCard title="Push Notifications" icon="notifications_active" color="warning">
        <ToggleSwitch id="push-messages" label="Messages" checked={pushMessages} onChange={setPushMessages} />
        <ToggleSwitch
          id="push-interview"
          label="Interview Reminder"
          checked={pushInterview}
          onChange={setPushInterview}
        />
        <ToggleSwitch
          id="push-profile"
          label="Profile Views"
          checked={pushProfileViews}
          onChange={setPushProfileViews}
        />
      </SectionCard>

      <SectionCard title="SMS Notifications" icon="sms" color="mode">
        <ToggleSwitch
          id="sms-security"
          label="Security Alerts"
          checked={smsSecurity}
          onChange={setSmsSecurity}
        />
        <ToggleSwitch id="sms-otp" label="OTP Messages" checked={smsOtp} onChange={setSmsOtp} />
      </SectionCard>

      <SectionCard title="Newsletter" icon="newspaper" color="skills">
        <ToggleSwitch
          id="newsletter"
          label="Product updates and career tips"
          description="Occasional emails about new features and career resources."
          checked={newsletter}
          onChange={setNewsletter}
        />
      </SectionCard>
    </SettingsPageShell>
  );
}
