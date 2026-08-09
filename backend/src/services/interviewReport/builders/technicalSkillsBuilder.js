export const buildTechnicalSkillsSection = (dimensions) =>
  dimensions?.technicalSkills || {
    label: 'Technical Skills',
    score: null,
    feedback: '',
    evidence: [],
  };
