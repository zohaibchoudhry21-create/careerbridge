import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import SectionCard from '../../components/settings/SectionCard';
import InputField from '../../components/settings/InputField';
import SelectField from '../../components/settings/SelectField';
import ProfileAvatar from '../../components/settings/ProfileAvatar';
import { getDisplayName } from '../../components/settings/profileUtils';
import {
  personalInformationFormToPayload,
  userToPersonalInformationForm,
} from '../../components/settings/personalInformationForm';
import {
  COUNTRY_OPTIONS,
  GENDER_OPTIONS,
  STATE_OPTIONS,
} from '../../components/settings/settingsDummyData';
import useAuth from '../../hooks/useAuth';
import { useUpdateAccount } from '../../hooks/useSettings';
import { getApiErrorMessage } from '../../features/interviewPrep/utils/apiErrorUtils';

const withEmptyOption = (options) => ['', ...options];

export default function PersonalInformation() {
  const { user } = useAuth();
  const updateAccount = useUpdateAccount();
  const baselineForm = useMemo(() => userToPersonalInformationForm(user), [user]);
  const [form, setForm] = useState(baselineForm);

  useEffect(() => {
    setForm(baselineForm);
  }, [baselineForm]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First name and last name are required.');
      return;
    }

    try {
      const result = await updateAccount.mutateAsync(personalInformationFormToPayload(form));
      toast.success(result?.message || 'Personal information saved successfully.');
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Unable to save changes. Please try again.')
      );
    }
  };

  const handleCancel = () => {
    setForm(baselineForm);
    toast.info('Changes discarded.');
  };

  return (
    <SettingsPageShell
      title="Personal Information"
      description="Update your profile details, contact information, and professional links."
      onSave={handleSave}
      onCancel={handleCancel}
      saving={updateAccount.isPending}
    >
      <SectionCard title="Profile photo" icon="person" color="role">
        <div className="flex items-center gap-4 min-w-0">
          <ProfileAvatar profile={form} fallbackUser={user} className="w-16 h-16 text-lg" />
          <div className="min-w-0">
            <p className="font-headline-section text-headline-section text-on-surface truncate">
              {getDisplayName(form, user)}
            </p>
            <p className="font-body-md text-on-surface-variant truncate mt-1">{form.email}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Personal Details" icon="person" color="role">
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
            options={withEmptyOption(GENDER_OPTIONS)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Location" icon="location_on" color="settings">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SelectField
            id="country"
            label="Country"
            value={form.country}
            onChange={updateField('country')}
            options={withEmptyOption(COUNTRY_OPTIONS)}
          />
          <SelectField
            id="state"
            label="State"
            value={form.state}
            onChange={updateField('state')}
            options={withEmptyOption(STATE_OPTIONS)}
          />
          <InputField id="city" label="City" value={form.city} onChange={updateField('city')} />
        </div>
      </SectionCard>

      <SectionCard title="Professional" icon="work" color="resume">
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
    </SettingsPageShell>
  );
}
