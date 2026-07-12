import { useRef } from 'react';
import AppIcon from '../../../../components/icons/AppIcon';
import { toast } from 'react-toastify';
import { PERSONAL_EXTRA_FIELD_OPTIONS } from '../../data/resumeSectionTypes';
import { useResumeEditor } from '../../context/ResumeEditorContext';
import {
  getPersonalPhoto,
  PHOTO_ACCEPT,
  PROFILE_PHOTO_SIZE,
  readProfilePhotoAsBase64,
} from '../../utils/personalDetailsPhoto';

function FieldRow({ label, children }) {
  return (
    <label className="block">
      <span className="font-label-sm text-on-surface-variant mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function ProfilePhotoUpload({ photo, onPhotoChange }) {
  const photoInputRef = useRef(null);
  const hasPhoto = Boolean(photo);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      const base64 = await readProfilePhotoAsBase64(file);
      onPhotoChange(base64);
    } catch (error) {
      toast.error(error.message || 'Could not upload photo.');
    }
  };

  return (
    <div className="flex flex-col items-start gap-sm">
      <button
        type="button"
        onClick={() => photoInputRef.current?.click()}
        className="group relative rounded-full border border-outline-variant bg-surface-container overflow-hidden shrink-0"
        style={{ width: PROFILE_PHOTO_SIZE, height: PROFILE_PHOTO_SIZE }}
        aria-label="Upload profile photo"
      >
        {hasPhoto ? (
          <img
            src={photo}
            alt="Profile"
            className="h-full w-full object-cover"
            style={{ borderRadius: '50%' }}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-surface-container-high">
            <AppIcon name="person" size="h-8 w-8" className="text-on-surface-variant" />
          </span>
        )}

        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/35 transition-colors">
          <AppIcon
            name="photo_camera"
            size="h-[22px] w-[22px]"
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </span>
      </button>

      <input
        ref={photoInputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />

      <p className="font-body-sm text-on-surface-variant">Click to upload profile photo</p>

      {hasPhoto ? (
        <button
          type="button"
          onClick={() => onPhotoChange('')}
          className="font-label-sm text-error hover:underline"
        >
          Remove photo
        </button>
      ) : null}
    </div>
  );
}

export default function PersonalDetailsForm({ onDone }) {
  const { state, dispatch } = useResumeEditor();
  const { personalDetails } = state;

  const update = (payload) => dispatch({ type: 'UPDATE_PERSONAL', payload });

  const addExtraField = (label) => {
    if (personalDetails.extraFields.some((field) => field.label === label)) return;
    update({
      extraFields: [...personalDetails.extraFields, { label, value: '' }],
    });
  };

  const handlePhotoChange = (photo) => {
    update({ photo, photoUrl: photo });
  };

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Edit Personal Details</h3>
        <button type="button" className="font-label-sm text-secondary hover:underline">
          Get Tips
        </button>
      </div>

      <ProfilePhotoUpload photo={getPersonalPhoto(personalDetails)} onPhotoChange={handlePhotoChange} />

      <FieldRow label="Full name">
        <input
          value={personalDetails.fullName}
          onChange={(event) => update({ fullName: event.target.value })}
          className="w-full rounded-xl border border-outline-variant px-md py-sm outline-none focus:border-secondary"
        />
      </FieldRow>

      <FieldRow label="Professional title">
        <input
          value={personalDetails.professionalTitle}
          onChange={(event) => update({ professionalTitle: event.target.value })}
          className="w-full rounded-xl border border-outline-variant px-md py-sm outline-none focus:border-secondary"
        />
      </FieldRow>

      {[
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'location', label: 'Location' },
        { key: 'website', label: 'Website', link: true },
        { key: 'linkedin', label: 'LinkedIn', link: true },
      ].map((field) => (
        <FieldRow key={field.key} label={field.label}>
          <div className="flex gap-2">
            <input
              value={personalDetails[field.key] || ''}
              onChange={(event) => update({ [field.key]: event.target.value })}
              className="flex-1 rounded-xl border border-outline-variant px-md py-sm outline-none focus:border-secondary"
            />
            {field.link && (
              <button type="button" className="rounded-xl border border-outline-variant px-sm text-secondary">
                <AppIcon name="link" size="button" className="text-secondary" />
              </button>
            )}
            <button type="button" className="rounded-xl border border-outline-variant px-sm text-on-surface-variant">
              <AppIcon name="swap_vert" size="button" className="text-on-surface-variant" />
            </button>
          </div>
        </FieldRow>
      ))}

      <div className="flex flex-wrap gap-2">
        {PERSONAL_EXTRA_FIELD_OPTIONS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => addExtraField(label)}
            className="rounded-full border border-outline-variant px-sm py-1 font-label-sm text-on-surface-variant hover:border-secondary/40"
          >
            + {label}
          </button>
        ))}
      </div>

      {personalDetails.extraFields?.map((field, index) => (
        <FieldRow key={field.label} label={field.label}>
          <input
            value={field.value}
            onChange={(event) => {
              const extraFields = [...personalDetails.extraFields];
              extraFields[index] = { ...field, value: event.target.value };
              update({ extraFields });
            }}
            className="w-full rounded-xl border border-outline-variant px-md py-sm outline-none focus:border-secondary"
          />
        </FieldRow>
      ))}

      <button
        type="button"
        onClick={onDone}
        className="w-full rounded-xl bg-secondary py-sm font-label-md text-on-secondary hover:bg-secondary-container transition-colors"
      >
        Done
      </button>
    </div>
  );
}
