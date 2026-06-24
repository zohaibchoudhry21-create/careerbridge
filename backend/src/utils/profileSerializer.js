const splitNameParts = (name = '') => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }

  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: '' };
  }

  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1).trim(),
  };
};

export const resolveNameParts = (user) => splitNameParts(user.name);

export const buildProfileResponse = (user) => {
  const { firstName, lastName } = resolveNameParts(user);

  return {
    name: user.name,
    firstName,
    lastName,
    email: user.email,
    avatar: user.avatar,
  };
};

export default buildProfileResponse;
