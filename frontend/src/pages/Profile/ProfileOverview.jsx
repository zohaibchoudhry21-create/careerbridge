import useAuth from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useProfile';
import ProfileAvatar from '../../components/profile/ProfileAvatar';
import ProfileError from '../../components/profile/ProfileError';
import ProfileLoading from '../../components/profile/ProfileLoading';
import { getDisplayName } from '../../components/profile/profileUtils';

export default function ProfileOverview() {
  const { user } = useAuth();
  const { data: profile, isLoading, isError, error, refetch } = useUserProfile();

  const displayName = getDisplayName(profile, user);
  const email = profile?.email || user?.email;

  return (
    <div className="min-w-0">
      <header className="mb-md min-w-0">
        <h1 className="font-headline-dashboard text-headline-dashboard text-on-surface">
          Profile
        </h1>
        <p className="font-body-md text-on-surface-variant mt-base">
          Your account information.
        </p>
      </header>

      {isLoading ? (
        <ProfileLoading />
      ) : isError ? (
        <ProfileError
          message={error?.response?.data?.message || error?.message || 'Unable to load profile.'}
          onRetry={refetch}
        />
      ) : (
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest dashboard-card-padding shadow-sm min-w-0">
          <div className="flex items-start gap-sm min-w-0">
            <ProfileAvatar profile={profile} fallbackUser={user} />
            <div className="min-w-0 flex-1">
              <h2 className="font-headline-section text-headline-section text-on-surface truncate">{displayName}</h2>
              <p className="font-body-md text-on-surface-variant truncate mt-1">{email}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
