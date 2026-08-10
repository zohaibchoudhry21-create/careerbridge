export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

/** Max edge length after client-side resize (keeps base64 under API body limits). */
export const PROFILE_PHOTO_MAX_EDGE = 400;

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

const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the photo file.'));
    };
    img.src = url;
  });

/**
 * Read and compress a profile photo to a JPEG data URL suitable for resume JSON payloads.
 */
export const readProfilePhotoAsBase64 = async (file) => {
  const error = validateProfilePhotoFile(file);
  if (error) {
    throw new Error(error);
  }

  const img = await loadImageFromFile(file);
  const scale = Math.min(1, PROFILE_PHOTO_MAX_EDGE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not process the photo.');
  }
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.82);
};
