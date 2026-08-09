import { CAREER_SUGGESTIONS_MAX, ROADMAP_MAX } from '../../../config/interviewReportConfig.js';
import { WEAKNESS_SCORE_THRESHOLD } from '../../../config/interviewReportConfig.js';

export const buildRoadmapAndCareer = ({ dimensions = {}, narrative = {}, role } = {}) => {
  const learningRoadmap = [];
  const careerSuggestions = [];

  for (const item of narrative.learningRoadmap || []) {
    if (learningRoadmap.length >= ROADMAP_MAX) break;
    if (!item?.title) continue;
    learningRoadmap.push({
      title: String(item.title).trim(),
      why: String(item.why || '').trim(),
      actions: (Array.isArray(item.actions) ? item.actions : [])
        .map((a) => String(a || '').trim())
        .filter(Boolean)
        .slice(0, 5),
      priority: item.priority || 'medium',
    });
  }

  // Deterministic stubs for weak dimensions if Groq omitted them.
  if (!learningRoadmap.length) {
    for (const [, dim] of Object.entries(dimensions)) {
      if (dim?.score == null || dim.score >= WEAKNESS_SCORE_THRESHOLD) continue;
      if (learningRoadmap.length >= ROADMAP_MAX) break;
      learningRoadmap.push({
        title: `Strengthen ${dim.label}`,
        why: `Scored ${dim.score}/100 in this interview.`,
        actions: [`Practice ${dim.label.toLowerCase()} scenarios for a ${role || 'target'} role`],
        priority: dim.score < 40 ? 'high' : 'medium',
      });
    }
  }

  for (const item of narrative.careerSuggestions || []) {
    if (careerSuggestions.length >= CAREER_SUGGESTIONS_MAX) break;
    if (!item?.title) continue;
    careerSuggestions.push({
      title: String(item.title).trim(),
      rationale: String(item.rationale || '').trim(),
    });
  }

  if (!careerSuggestions.length && role) {
    careerSuggestions.push({
      title: `Continue preparing for ${role}`,
      rationale: 'Focus on the lowest-scoring dimensions from this session before re-interviewing.',
    });
  }

  return { learningRoadmap, careerSuggestions };
};
