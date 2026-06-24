export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

export const PROFILE_PHOTO_SIZE = 80;

/** Larger profile photo in full-page resume templates (editor + card previews). */
export const TEMPLATE_PROFILE_PHOTO_SIZE = 110;

/** Stock portraits for template selection card previews only. */
export const TEMPLATE_PREVIEW_ATLANTIC_PHOTO =
  'https://randomuser.me/api/portraits/men/32.jpg';
export const TEMPLATE_PREVIEW_MERCURY_PHOTO =
  'https://randomuser.me/api/portraits/women/65.jpg';
export const TEMPLATE_PREVIEW_STEADY_PHOTO =
  'https://randomuser.me/api/portraits/men/75.jpg';

export const getPersonalPhoto = (personalDetails = {}) =>
  personalDetails.photo || personalDetails.photoUrl || '';

export const validateProfilePhotoFile = (file) => {
  if (!file) return 'No file selected.';

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return 'Use a JPEG, PNG, or WebP image.';
  }

  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    return 'Photo must be 5MB or smaller.';
  }

  return null;
};

export const readProfilePhotoAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const error = validateProfilePhotoFile(file);
    if (error) {
      reject(new Error(error));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the photo file.'));
    reader.readAsDataURL(file);
  });
