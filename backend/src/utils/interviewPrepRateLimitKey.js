/**
 * Rate-limit bucket key for interview-prep routes (per user when authenticated).
 */
export const getInterviewPrepRateLimitKey = (req) => {
  if (req.user?._id) {
    return `user:${req.user._id}`;
  }
  return `ip:${req.ip}`;
};
