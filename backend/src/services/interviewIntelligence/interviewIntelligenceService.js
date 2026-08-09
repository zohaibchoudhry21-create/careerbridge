/**
 * Orchestrates create-time interview intelligence (brief + question guide).
 */

import { buildInterviewContextBrief } from './contextBriefBuilder.js';
import { generateInterviewQuestionGuide } from './questionGuideGroqService.js';
import { buildAdaptiveFollowUpPolicyPrompt } from './adaptiveFollowUpPolicy.js';
import { buildDomainFollowUpPlaybooksPrompt } from './domainFollowUpPlaybooks.js';
import { buildMemoryAndValidationPolicyPrompt } from './memoryAndValidationPolicy.js';

/**
 * Prepare intelligence payload before Vapi assistant creation.
 * @param {object} sessionLike — role, difficulty, duration, resume/JD fields, focusAreas
 */
export const prepareInterviewIntelligence = async (sessionLike = {}) => {
  const brief = buildInterviewContextBrief(sessionLike);
  const questions = await generateInterviewQuestionGuide({
    roleLabel: brief.roleLabel,
    difficulty: brief.difficulty,
    durationMinutes: sessionLike.durationMinutes,
    focusAreas: brief.focusAreas,
    brief,
  });

  return {
    interviewContextBrief: brief,
    questions,
  };
};

/** Compact policy block for system prompt assembly. */
export const buildInterviewIntelligencePoliciesPrompt = () =>
  [
    buildMemoryAndValidationPolicyPrompt(),
    buildAdaptiveFollowUpPolicyPrompt(),
    buildDomainFollowUpPlaybooksPrompt(),
  ].join('\n\n');
