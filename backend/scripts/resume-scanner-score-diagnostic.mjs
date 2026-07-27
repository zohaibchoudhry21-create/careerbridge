import { computeAnalysisScores } from '../src/utils/resumeScannerScoring.js';

const scenarios = [
  {
    name: 'mismatched-nurse-vs-swe',
    resumeText: `Alex Chen
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
Patient care, IV therapy, EHR documentation, HIPAA compliance`,
    skills: [
      { id: 's1', name: 'React', type: 'required', synonyms: ['React.js'] },
      { id: 's2', name: 'TypeScript', type: 'required', synonyms: [] },
      { id: 's3', name: 'Node.js', type: 'hard', synonyms: [] },
      { id: 's4', name: 'AWS', type: 'hard', synonyms: [] },
      { id: 's5', name: 'Docker', type: 'hard', synonyms: [] },
      { id: 's6', name: 'Kubernetes', type: 'hard', synonyms: [] },
      { id: 's7', name: 'PostgreSQL', type: 'hard', synonyms: [] },
      { id: 's8', name: 'CI/CD', type: 'hard', synonyms: [] },
    ],
    aiAssessedRelevance: 42,
  },
  {
    name: 'strong-content-marketing-match',
    resumeText: `Jane Jobscan
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
Content Strategy, SEO, Google Analytics 4, GA4, Agile, Project Management, Brand Marketing`,
    skills: [
      { id: 'm1', name: 'Content Strategy', type: 'required', synonyms: [] },
      { id: 'm2', name: 'B2B Content Marketing', type: 'required', synonyms: [] },
      { id: 'm3', name: 'Google Analytics 4', type: 'hard', synonyms: ['GA4'] },
      { id: 'm4', name: 'SEO', type: 'hard', synonyms: [] },
      { id: 'm5', name: 'Integrated Campaigns', type: 'hard', synonyms: [] },
      { id: 'm6', name: 'Brand Marketing', type: 'hard', synonyms: [] },
      { id: 'm7', name: 'Project Management', type: 'hard', synonyms: [] },
    ],
    aiAssessedRelevance: 78,
  },
  {
    name: 'sparse-format-strong-keyword-match',
    resumeText: 'React TypeScript Node.js AWS developer. Built apps.',
    skills: [
      { id: 's1', name: 'React', type: 'required', synonyms: ['React.js'] },
      { id: 's2', name: 'TypeScript', type: 'required', synonyms: [] },
      { id: 's3', name: 'Node.js', type: 'hard', synonyms: [] },
      { id: 's4', name: 'AWS', type: 'hard', synonyms: [] },
    ],
    aiAssessedRelevance: 55,
    searchabilityIssues: ['Missing contact email', 'Missing LinkedIn URL', 'No section headings'],
  },
];

for (const scenario of scenarios) {
  const result = computeAnalysisScores({
    resumeText: scenario.resumeText,
    structuredSections: {},
    searchabilityIssues: scenario.searchabilityIssues || [],
    skills: scenario.skills,
    aiAssessedRelevance: scenario.aiAssessedRelevance,
  });

  console.log(
    JSON.stringify(
      {
        scenario: scenario.name,
        atsScore: result.atsScore,
        atsScoreBreakdown: result.atsScoreBreakdown,
        jobMatchScore: result.jobMatchScore,
        jobMatchBreakdown: result.jobMatchBreakdown,
        matchedSkills: result.matchedSkillIds.length,
        totalSkills: scenario.skills.length,
      },
      null,
      2
    )
  );
  console.log('---');
}
