/**
 * Deterministic, token-safe candidate + JD brief for the live interviewer prompt.
 * Prefers structured skills/projects over raw resume when present.
 */

import {
  BRIEF_COMPANY_MAX_CHARS,
  BRIEF_EXPERIENCE_MAX_CHARS,
  BRIEF_FOCUS_AREAS_MAX,
  BRIEF_PROJECTS_MAX,
  BRIEF_SKILLS_MAX,
  JD_EXCERPT_MAX_CHARS,
  RESUME_EXCERPT_MAX_CHARS,
} from '../../config/interviewIntelligenceConfig.js';

const truncate = (text, max) => {
  const s = String(text || '').trim().replace(/\s+/g, ' ');
  if (!s) return '';
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 1)).trim()}…`;
};

const cleanList = (items, max) =>
  (Array.isArray(items) ? items : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, max);

/**
 * @param {object} input — session-like fields
 * @returns {{
 *   roleLabel: string,
 *   difficulty: string,
 *   targetCompany: string,
 *   experience: string,
 *   focusAreas: string[],
 *   skills: string[],
 *   projects: string[],
 *   resumeExcerpt: string,
 *   jobDescriptionExcerpt: string,
 *   promptText: string,
 * }}
 */
export const buildInterviewContextBrief = (input = {}) => {
  const roleLabel = String(input.roleLabel || input.role || 'this role').trim();
  const difficulty = String(input.difficulty || 'medium').trim();
  const targetCompany = truncate(input.targetCompany, BRIEF_COMPANY_MAX_CHARS);
  const experience = truncate(input.experience, BRIEF_EXPERIENCE_MAX_CHARS);
  const focusAreas = cleanList(input.focusAreas, BRIEF_FOCUS_AREAS_MAX);
  const skills = cleanList(input.resumeSkills, BRIEF_SKILLS_MAX);
  const projects = cleanList(input.resumeProjects, BRIEF_PROJECTS_MAX);

  const hasStructured = skills.length > 0 || projects.length > 0;
  // Prefer structured signals; only include resume excerpt when structured is thin.
  const resumeExcerpt = hasStructured
    ? truncate(input.resumeText, Math.min(400, RESUME_EXCERPT_MAX_CHARS))
    : truncate(input.resumeText, RESUME_EXCERPT_MAX_CHARS);

  const jobDescriptionExcerpt = truncate(input.jobDescriptionText, JD_EXCERPT_MAX_CHARS);

  const lines = [];
  lines.push(`Role: ${roleLabel}`);
  lines.push(`Baseline difficulty: ${difficulty}`);
  if (targetCompany) lines.push(`Target company: ${targetCompany}`);
  if (experience) lines.push(`Candidate experience summary: ${experience}`);
  if (focusAreas.length) lines.push(`Focus areas: ${focusAreas.join(', ')}`);
  if (skills.length) lines.push(`Claimed skills (from resume analysis): ${skills.join(', ')}`);
  if (projects.length) lines.push(`Claimed projects: ${projects.join('; ')}`);
  if (resumeExcerpt) lines.push(`Resume excerpt (do not invent beyond this): ${resumeExcerpt}`);
  if (jobDescriptionExcerpt) {
    lines.push(`Job description excerpt (probe must-haves from this only): ${jobDescriptionExcerpt}`);
  }

  return {
    roleLabel,
    difficulty,
    targetCompany,
    experience,
    focusAreas,
    skills,
    projects,
    resumeExcerpt,
    jobDescriptionExcerpt,
    promptText: lines.join('\n'),
  };
};
