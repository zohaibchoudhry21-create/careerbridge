import { Link } from 'react-router-dom';

export default function InterviewPrivacyNotice() {
  return (
    <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-sm space-y-1">
      <p className="font-label-md text-on-surface">Before you begin</p>
      <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
        This mock interview uses your camera and microphone for live feedback (for example eye contact
        and speaking pace). Your answers are sent as audio and transcribed using Groq's
        speech-to-text service; we save the text transcript and analysis scores, not the raw
        recording files. Video is analyzed on your device—only summary metrics are sent to our
        servers, not a stored video of your session.
      </p>
      <p className="font-label-sm text-on-surface-variant">
        More about your data:{' '}
        <Link to="/settings/privacy" className="text-secondary hover:underline">
          Privacy settings
        </Link>
      </p>
    </div>
  );
}
