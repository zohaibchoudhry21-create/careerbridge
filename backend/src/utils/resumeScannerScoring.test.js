import { describe, expect, it } from 'vitest';
import {
  computeAnalysisScores,
  computeJobMatchScore,
  computeSkillMatches,
  findTextOffset,
  skillMatchesResume,
} from './resumeScannerScoring.js';

const skills = [
  {
    id: 'skill-react-1',
    name: 'React',
    type: 'hard',
    synonyms: ['React.js'],
  },
  {
    id: 'skill-ga4-1',
    name: 'Google Analytics 4',
    type: 'required',
    synonyms: ['GA4'],
  },
  {
    id: 'skill-python-1',
    name: 'Python',
    type: 'hard',
    synonyms: [],
  },
];

const nurseResume = `Alex Chen
Licensed Practical Nurse
alex.chen@email.com | 555-010-2233 | linkedin.com/in/alexchen

SUMMARY
Compassionate LPN with 6 years of hospital and long-term care experience.

EXPERIENCE
Staff Nurse, Riverside Medical Center
2019 - Present
- Administered medications and monitored vitals for 20+ patients per shift.
- Reduced patient fall incidents by 15% through proactive rounding.

EDUCATION
Diploma in Practical Nursing, City Technical College

SKILLS
Patient care, IV therapy, EHR documentation, HIPAA compliance`;

const sweSkills = [
  { id: 's1', name: 'React', type: 'required', synonyms: ['React.js'] },
  { id: 's2', name: 'TypeScript', type: 'required', synonyms: [] },
  { id: 's3', name: 'Node.js', type: 'hard', synonyms: [] },
  { id: 's4', name: 'AWS', type: 'hard', synonyms: [] },
  { id: 's5', name: 'Docker', type: 'hard', synonyms: [] },
  { id: 's6', name: 'Kubernetes', type: 'hard', synonyms: [] },
  { id: 's7', name: 'PostgreSQL', type: 'hard', synonyms: [] },
  { id: 's8', name: 'CI/CD', type: 'hard', synonyms: [] },
];

const strongMatchResume = `Jane Jobscan
Senior Content Marketing Manager
fakeemail@mail.com | 123-456-7890 | linkedin.com/in/jane

PROFESSIONAL SUMMARY
Results-oriented content marketing manager with 8 years of digital media experience.

WORK EXPERIENCE
Senior Content Marketing Manager, ACME
June 2022 - Present
- Led B2B content marketing strategy and integrated campaigns across channels.
- Increased revenue by 20% using Google Analytics 4 (GA4) and SEO insights.

EDUCATION
Bachelor of Arts in Marketing, State University

SKILLS
Content Strategy, SEO, Google Analytics 4, GA4, Agile, Project Management, Brand Marketing`;

const strongMatchSkills = [
  { id: 'm1', name: 'Content Strategy', type: 'required', synonyms: [] },
  { id: 'm2', name: 'B2B Content Marketing', type: 'required', synonyms: [] },
  { id: 'm3', name: 'Google Analytics 4', type: 'hard', synonyms: ['GA4'] },
  { id: 'm4', name: 'SEO', type: 'hard', synonyms: [] },
  { id: 'm5', name: 'Integrated Campaigns', type: 'hard', synonyms: [] },
  { id: 'm6', name: 'Brand Marketing', type: 'hard', synonyms: [] },
  { id: 'm7', name: 'Project Management', type: 'hard', synonyms: [] },
];

const sparseMatchResume = 'React TypeScript Node.js AWS developer. Built apps.';

describe('resumeScannerScoring', () => {
  it('matches skills with synonyms and acronyms', () => {
    const resumeText = 'Built dashboards with React.js and tracked traffic in GA4.';

    expect(skillMatchesResume(resumeText, skills[0]).matched).toBe(true);
    expect(skillMatchesResume(resumeText, skills[1]).matched).toBe(true);
    expect(skillMatchesResume(resumeText, skills[2]).matched).toBe(false);
  });

  it('matches compound SEO skills when resume lists variants separately', () => {
    const resumeText =
      'SEO & Digital Marketing: On-Page, Off-Page, Technical SEO, Keyword Research, Analytics';
    expect(skillMatchesResume(resumeText, { name: 'On-Page SEO' }).matched).toBe(true);
    expect(skillMatchesResume(resumeText, { name: 'Technical SEO' }).matched).toBe(true);
  });

  it('computes matched and missing skill ids', () => {
    const resumeText = 'Experienced with React.js and GA4 analytics.';
    const result = computeSkillMatches(resumeText, skills);

    expect(result.matchedSkillIds).toEqual(['skill-react-1', 'skill-ga4-1']);
    expect(result.missingSkillIds).toEqual(['skill-python-1']);
  });

  it('matches SEO from Mongoose-like subdocs that lose fields when spread', () => {
    const resumeText =
      'Executing full-spectrum off-page SEO strategies and overall SEO strategy';
    const mongooseLikeSkill = {
      _doc: { id: 'skill-seo-1', name: 'SEO', type: 'required', synonyms: [] },
      toObject() {
        return { id: 'skill-seo-1', name: 'SEO', type: 'required', synonyms: [] };
      },
      get(key) {
        return this._doc[key];
      },
    };
    Object.defineProperty(mongooseLikeSkill, 'name', {
      get() {
        return this._doc.name;
      },
    });
    Object.defineProperty(mongooseLikeSkill, 'id', {
      get() {
        return this._doc.id;
      },
    });

    // Spreading such objects must not be used for matching — computeSkillMatches should toObject.
    expect(Object.keys({ ...mongooseLikeSkill }).includes('name')).toBe(false);

    const result = computeSkillMatches(resumeText, [mongooseLikeSkill]);
    expect(result.matchedSkillIds).toContain('skill-seo-1');
    expect(result.skills[0].matched).toBe(true);
    expect(
      computeJobMatchScore({ skills: result.skills, aiAssessedRelevance: 70 }).jobMatchScore
    ).toBeGreaterThanOrEqual(70);
  });

  it('finds substring offsets case-insensitively', () => {
    const resumeText = 'Led content marketing strategy.';
    const offset = findTextOffset(resumeText, 'content marketing');

    expect(offset.charStart).toBe(4);
    expect(offset.charEnd).toBe(21);
  });

  it('scores mismatched resume/JD with low job match but healthy ATS score', () => {
    const result = computeAnalysisScores({
      resumeText: nurseResume,
      structuredSections: {},
      searchabilityIssues: ['Missing GitHub profile'],
      skills: sweSkills,
      aiAssessedRelevance: 42,
    });

    expect(result.jobMatchScore).toBeGreaterThanOrEqual(0);
    expect(result.jobMatchScore).toBeLessThanOrEqual(15);
    expect(result.atsScore).toBeGreaterThanOrEqual(70);
    expect(result.jobMatchBreakdown.keywordCoverage).toBe(0);
  });

  it('scores strong resume/JD match in the 70-85+ job match range', () => {
    const result = computeAnalysisScores({
      resumeText: strongMatchResume,
      structuredSections: {},
      searchabilityIssues: [],
      skills: strongMatchSkills,
      aiAssessedRelevance: 78,
    });

    expect(result.jobMatchScore).toBeGreaterThanOrEqual(70);
    expect(result.jobMatchScore).toBeLessThanOrEqual(100);
    expect(result.jobMatchBreakdown.keywordCoverage).toBeGreaterThanOrEqual(70);
  });

  it('keeps ATS and job match scores independent for sparse but relevant resumes', () => {
    const result = computeAnalysisScores({
      resumeText: sparseMatchResume,
      structuredSections: {},
      searchabilityIssues: ['Missing contact email', 'Missing LinkedIn URL'],
      skills: sweSkills.slice(0, 4),
      aiAssessedRelevance: 55,
    });

    expect(result.atsScore).toBeLessThan(50);
    expect(result.jobMatchScore).toBeGreaterThanOrEqual(40);
    expect(result.atsScoreBreakdown.sectionCompleteness).toBeLessThan(50);
    expect(result.jobMatchBreakdown.keywordCoverage).toBeGreaterThanOrEqual(50);
  });
});
