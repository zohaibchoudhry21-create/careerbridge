/**
 * Debug-mode NDJSON logger (session cf8614).
 * Posts to Cursor ingest + local Vite sink so we always get a file on disk.
 */
export function agentDbgLog({ hypothesisId, location, message, data = {}, runId = 'early-end' }) {
  const payload = {
    sessionId: 'cf8614',
    runId,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  const body = JSON.stringify(payload);
  // #region agent log
  fetch('http://127.0.0.1:7480/ingest/650784c0-9e07-4bcc-8ec8-e34fb6f89e23', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cf8614' },
    body,
  }).catch(() => {});
  fetch('/__dbg/cf8614', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(() => {});
  // #endregion
}
