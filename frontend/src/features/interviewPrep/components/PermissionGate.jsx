import { useMemo } from 'react';
import AppIcon from '../../../components/icons/AppIcon';
import InterviewPrivacyNotice from './InterviewPrivacyNotice';
import {
  getMediaPermissionIssue,
  PERMISSION_ISSUE_COPY,
} from '../utils/mediaPermissionUtils';

export default function PermissionGate({
  status,
  error,
  permissionIssue,
  onRequest,
  showPrivacyNotice = true,
  children,
}) {
  if (status === 'granted' && children) {
    return children;
  }

  const issue = permissionIssue || getMediaPermissionIssue(error);
  const issueMessage = issue ? PERMISSION_ISSUE_COPY[issue] : null;

  return (
    <div className="dashboard-glass-card dashboard-card-padding rounded-2xl space-y-md max-w-xl">
      <div className="flex items-center gap-sm">
        <AppIcon name="photo_camera" size="dashboard" className="text-secondary" />
        <h2 className="font-headline-section text-headline-section">Camera & microphone</h2>
      </div>
      {showPrivacyNotice ? <InterviewPrivacyNotice /> : null}
      {issueMessage ? (
        <p className="font-body-md text-error text-sm">{issueMessage}</p>
      ) : null}
      <button
        type="button"
        onClick={onRequest}
        disabled={status === 'requesting'}
        className="px-6 py-3 rounded-xl bg-secondary text-white font-label-md min-h-[44px] inline-flex items-center gap-2 disabled:opacity-60"
      >
        {status === 'requesting' ? (
          <>
            <AppIcon name="progress_activity" size="sm" spin />
            Requesting access…
          </>
        ) : (
          'Allow camera & microphone'
        )}
      </button>
    </div>
  );
}

export function usePermissionIssue(error) {
  return useMemo(() => getMediaPermissionIssue(error), [error]);
}
