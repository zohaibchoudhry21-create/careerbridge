import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import useAuth from '../../hooks/useAuth';
import { useUpdateAccount } from '../../hooks/useSettings';
import { getApiErrorMessage } from '../../features/interviewPrep/utils/apiErrorUtils';

const GENDER_OPTION_DEFS = [
  { value: 'Male', labelKey: 'personal.genderOptions.male' },
  { value: 'Female', labelKey: 'personal.genderOptions.female' },
  { value: 'Non-binary', labelKey: 'personal.genderOptions.nonBinary' },
  { value: 'Prefer not to say', labelKey: 'personal.genderOptions.preferNotToSay' },
];

const COUNTRY_OPTION_DEFS = [
  { value: 'United States', labelKey: 'personal.countryOptions.unitedStates' },
  { value: 'Canada', labelKey: 'personal.countryOptions.canada' },
  { value: 'United Kingdom', labelKey: 'personal.countryOptions.unitedKingdom' },
  { value: 'India', labelKey: 'personal.countryOptions.india' },
  { value: 'Australia', labelKey: 'personal.countryOptions.australia' },
];

const STATE_OPTION_DEFS = [
  { value: 'California', labelKey: 'personal.stateOptions.california' },
  { value: 'New York', labelKey: 'personal.stateOptions.newYork' },
  { value: 'Texas', labelKey: 'personal.stateOptions.texas' },
  { value: 'Washington', labelKey: 'personal.stateOptions.washington' },
  { value: 'Illinois', labelKey: 'personal.stateOptions.illinois' },
];

export default function PersonalInformation() {
  const { t } = useTranslation('settings');
  const { user } = useAuth();
  const updateAccount = useUpdateAccount();
  const baselineForm = useMemo(() => userToPersonalInformationForm(user), [user]);
  const [form, setForm] = useState(baselineForm);

  const genderOptions = useMemo(
    () => [
      { value: '', label: '—' },
      ...GENDER_OPTION_DEFS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    ],
    [t]
  );

  const countryOptions = useMemo(
    () => [
      { value: '', label: '—' },
      ...COUNTRY_OPTION_DEFS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    ],
    [t]
  );

  const stateOptions = useMemo(
    () => [
      { value: '', label: '—' },
      ...STATE_OPTION_DEFS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    ],
    [t]
  );

  useEffect(() => {
    setForm(baselineForm);
  }, [baselineForm]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error(t('personal.toasts.nameRequired'));
      return;
    }

    try {
      const result = await updateAccount.mutateAsync(personalInformationFormToPayload(form));
      toast.success(result?.message || t('personal.toasts.saveSuccess'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('personal.toasts.saveError')));
    }
  };

  const handleCancel = () => {
    setForm(baselineForm);
    toast.info(t('personal.toasts.discarded'));
  };

  return (
    <SettingsPageShell
      title={t('personal.title')}
      description={t('personal.description')}
      onSave={handleSave}
      onCancel={handleCancel}
      saving={updateAccount.isPending}
    >
      <SectionCard title={t('personal.profilePhoto')} icon="person" color="role">
        <div className="flex items-center gap-4 min-w-0">
          <ProfileAvatar profile={form} fallbackUser={user} className="w-16 h-16 text-lg" />
          <div className="min-w-0">
            <p className="font-headline-section text-headline-section app-heading truncate">
              {getDisplayName(form, user)}
            </p>
            <p className="font-body-md app-muted truncate mt-1">{form.email}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t('personal.personalDetails')} icon="person" color="role">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            id="firstName"
            label={t('personal.firstName')}
            value={form.firstName}
            onChange={updateField('firstName')}
            required
          />
          <InputField
            id="lastName"
            label={t('personal.lastName')}
            value={form.lastName}
            onChange={updateField('lastName')}
            required
          />
          <InputField
            id="email"
            label={t('personal.email')}
            value={form.email}
            readOnly
            className="sm:col-span-2"
          />
          <InputField
            id="phone"
            label={t('personal.phone')}
            value={form.phone}
            onChange={updateField('phone')}
            type="tel"
          />
          <InputField
            id="dateOfBirth"
            label={t('personal.dateOfBirth')}
            value={form.dateOfBirth}
            onChange={updateField('dateOfBirth')}
            type="date"
          />
          <SelectField
            id="gender"
            label={t('personal.gender')}
            value={form.gender}
            onChange={updateField('gender')}
            options={genderOptions}
          />
        </div>
      </SectionCard>

      <SectionCard title={t('personal.location')} icon="location_on" color="settings">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SelectField
            id="country"
            label={t('personal.country')}
            value={form.country}
            onChange={updateField('country')}
            options={countryOptions}
          />
          <SelectField
            id="state"
            label={t('personal.state')}
            value={form.state}
            onChange={updateField('state')}
            options={stateOptions}
          />
          <InputField id="city" label={t('personal.city')} value={form.city} onChange={updateField('city')} />
        </div>
      </SectionCard>

      <SectionCard title={t('personal.professional')} icon="work" color="resume">
        <div className="grid grid-cols-1 gap-4">
          <InputField
            id="linkedin"
            label={t('personal.linkedin')}
            value={form.linkedin}
            onChange={updateField('linkedin')}
            type="url"
          />
          <InputField
            id="portfolio"
            label={t('personal.portfolio')}
            value={form.portfolio}
            onChange={updateField('portfolio')}
            type="url"
          />
          <InputField
            id="headline"
            label={t('personal.headline')}
            value={form.headline}
            onChange={updateField('headline')}
          />
        </div>
      </SectionCard>
    </SettingsPageShell>
  );
}
