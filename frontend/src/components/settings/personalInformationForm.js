export const EMPTY_PERSONAL_INFORMATION_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  country: '',
  state: '',
  city: '',
  linkedin: '',
  portfolio: '',
  headline: '',
  avatar: null,
};

/**
 * Map session user → Personal Information form state.
 * @param {object | null | undefined} user
 */
export function userToPersonalInformationForm(user) {
  if (!user) {
    return { ...EMPTY_PERSONAL_INFORMATION_FORM };
  }

  let firstName = String(user.firstName || '').trim();
  let lastName = String(user.lastName || '').trim();

  if (!firstName && !lastName && user.name) {
    const parts = String(user.name).trim().split(/\s+/);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ');
  }

  return {
    firstName,
    lastName,
    email: user.email || '',
    phone: user.phone || '',
    dateOfBirth: user.dateOfBirth || '',
    gender: user.gender || '',
    country: user.country || '',
    state: user.state || '',
    city: user.city || '',
    linkedin: user.linkedin || '',
    portfolio: user.portfolio || '',
    headline: user.headline || '',
    avatar: user.avatar || null,
  };
}

/**
 * @param {typeof EMPTY_PERSONAL_INFORMATION_FORM} form
 */
export function personalInformationFormToPayload(form) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phone: form.phone.trim(),
    dateOfBirth: form.dateOfBirth.trim(),
    gender: form.gender.trim(),
    country: form.country.trim(),
    state: form.state.trim(),
    city: form.city.trim(),
    linkedin: form.linkedin.trim(),
    portfolio: form.portfolio.trim(),
    headline: form.headline.trim(),
  };
}
