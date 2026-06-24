import { DEFAULT_AVATAR } from '../dashboard/dashboardConstants';
import { getInitials } from './profileUtils';

export default function ProfileAvatar({ profile, fallbackUser, className = 'w-16 h-16 text-lg' }) {
  const avatarSrc = profile?.avatar || fallbackUser?.avatar;
  const initials = getInitials(profile, fallbackUser);

  if (avatarSrc) {
    return (
      <img
        alt=""
        src={avatarSrc}
        className={`${className} rounded-full object-cover shrink-0 border border-outline-variant/30`}
        loading="lazy"
        onError={(event) => {
          event.currentTarget.src = DEFAULT_AVATAR;
        }}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full shrink-0 flex items-center justify-center bg-secondary/10 text-secondary font-bold border border-secondary/20`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
