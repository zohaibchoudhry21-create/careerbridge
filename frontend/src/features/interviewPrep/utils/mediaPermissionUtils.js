/**
 * Maps getUserMedia errors to user-facing permission issue types.
 * Returns null for non-media errors (e.g. Axios / API failures).
 * @param {DOMException | Error | null | undefined} error
 * @returns {'denied' | 'not_found' | 'in_use' | 'unknown' | null}
 */
export function getMediaPermissionIssue(error) {
  if (!error) return null;

  if (error.isAxiosError || error.response != null) {
    return null;
  }

  const name = error.name || '';
  const message = (error.message || '').toLowerCase();

  if (name === 'AxiosError' || name === 'CanceledError') {
    return null;
  }

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'denied';
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'not_found';
  }

  if (
    name === 'NotReadableError' ||
    name === 'TrackStartError' ||
    message.includes('in use') ||
    message.includes('device in use')
  ) {
    return 'in_use';
  }

  if (name === 'DOMException' || name === 'AbortError' || message.includes('media')) {
    return 'unknown';
  }

  return null;
}

export const PERMISSION_ISSUE_COPY = {
  denied:
    'Camera or microphone access was blocked. Allow both in your browser site settings, then try again.',
  not_found:
    'No camera or microphone was found on this device. Connect a mic/webcam or use a device that has them, then try again.',
  in_use:
    'Your camera or microphone may already be in use by another app (Zoom, Teams, etc.). Close that app and try again.',
  unknown:
    'We could not access your camera or microphone. Check your device and browser permissions, then try again.',
};
