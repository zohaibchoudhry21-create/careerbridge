import { useState } from 'react';
import { toast } from 'react-toastify';
import SettingsPageShell, { simulateSave } from '../../components/settings/SettingsPageShell';
import SectionCard from '../../components/settings/SectionCard';
import InputField, { TextAreaField } from '../../components/settings/InputField';
import SelectField from '../../components/settings/SelectField';
import {
  COUNTRY_OPTIONS,
  DUMMY_PROFILE,
  GENDER_OPTIONS,
  STATE_OPTIONS,
} from '../../components/settings/settingsDummyData';

export default function PersonalInformation() {
  const [form, setForm] = useState(DUMMY_PROFILE);
  const [saving, setSaving] = useState(false);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First name and last name are required.');
      return;
    }

    setSaving(true);
    try {
      await simulateSave();
      toast.success('Personal information saved successfully.');
    } catch {
      toast.error('Unable to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(DUMMY_PROFILE);
    toast.info('Changes discarded.');
  };

  return (
    <SettingsPageShell
      title="Personal Information"
      description="Update your profile details, contact information, and professional links."
      onSave={handleSave}
      onCancel={handleCancel}
      saving={saving}
    >
      <SectionCard title="Personal Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            id="firstName"
            label="First Name"
            value={form.firstName}
            onChange={updateField('firstName')}
            required
          />
          <InputField
            id="lastName"
            label="Last Name"
            value={form.lastName}
            onChange={updateField('lastName')}
            required
          />
          <InputField
            id="email"
            label="Email"
            value={form.email}
            readOnly
            className="sm:col-span-2"
          />
          <InputField
            id="phone"
            label="Phone Number"
            value={form.phone}
            onChange={updateField('phone')}
            type="tel"
          />
          <InputField
            id="dateOfBirth"
            label="Date of Birth"
            value={form.dateOfBirth}
            onChange={updateField('dateOfBirth')}
            type="date"
          />
          <SelectField
            id="gender"
            label="Gender"
            value={form.gender}
            onChange={updateField('gender')}
            options={GENDER_OPTIONS}
          />
        </div>
      </SectionCard>

      <SectionCard title="Location">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SelectField
            id="country"
            label="Country"
            value={form.country}
            onChange={updateField('country')}
            options={COUNTRY_OPTIONS}
          />
          <SelectField
            id="state"
            label="State"
            value={form.state}
            onChange={updateField('state')}
            options={STATE_OPTIONS}
          />
          <InputField id="city" label="City" value={form.city} onChange={updateField('city')} />
        </div>
      </SectionCard>

      <SectionCard title="Professional">
        <div className="grid grid-cols-1 gap-4">
          <InputField
            id="linkedin"
            label="LinkedIn URL"
            value={form.linkedin}
            onChange={updateField('linkedin')}
            type="url"
          />
          <InputField
            id="portfolio"
            label="Portfolio Website"
            value={form.portfolio}
            onChange={updateField('portfolio')}
            type="url"
          />
          <InputField
            id="headline"
            label="Professional Headline"
            value={form.headline}
            onChange={updateField('headline')}
          />
        </div>
      </SectionCard>

      <SectionCard title="About">
        <TextAreaField
          id="bio"
          label="Bio"
          value={form.bio}
          onChange={updateField('bio')}
          placeholder="Tell recruiters and hiring managers about yourself..."
        />
      </SectionCard>
    </SettingsPageShell>
  );
}
