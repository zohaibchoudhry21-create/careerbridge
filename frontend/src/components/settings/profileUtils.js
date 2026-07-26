export const getDisplayName = (profile, fallbackUser) => {
  const firstName = profile?.firstName?.trim();
  const lastName = profile?.lastName?.trim();

  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ');
  }

  return profile?.name || fallbackUser?.name || 'User';
};

export const getInitials = (profile, fallbackUser) => {
  const firstName = profile?.firstName?.trim();
  const lastName = profile?.lastName?.trim();

  if (firstName || lastName) {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  }

  const name = profile?.name || fallbackUser?.name || 'User';
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};
