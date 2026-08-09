/**
 * Shared LLM timeout for Resume Scanner analyze + rewrite pipeline.
 * Prevents hung provider calls from blocking background jobs indefinitely.
 */
export const RESUME_SCANNER_LLM_TIMEOUT_MS = 90_000;
