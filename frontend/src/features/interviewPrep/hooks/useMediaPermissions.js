import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMediaPermissionIssue } from '../utils/mediaPermissionUtils';

export function useMediaPermissions() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);

  const stopStream = useCallback(() => {
    setStream((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });
  }, []);

  const requestAccess = useCallback(async () => {
    setError(null);
    setStatus('requesting');

    try {
      stopStream();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      setStatus('granted');
      return mediaStream;
    } catch (err) {
      setStatus('denied');
      setError(err);
      throw err;
    }
  }, [stopStream]);

  useEffect(() => () => stopStream(), [stopStream]);

  useEffect(() => {
    const hasLiveTrack = stream?.getTracks?.().some((track) => track.readyState === 'live');
    if (hasLiveTrack && status !== 'granted') {
      setStatus('granted');
    }
  }, [stream, status]);

  const permissionIssue = useMemo(() => getMediaPermissionIssue(error), [error]);

  return useMemo(
    () => ({
      status,
      error,
      permissionIssue,
      stream,
      requestAccess,
      stopStream,
    }),
    [status, error, permissionIssue, stream, requestAccess, stopStream]
  );
}
