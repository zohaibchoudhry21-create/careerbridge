import 'dotenv/config';
import { analyzeResumeAgainstJob } from '../src/utils/resumeScannerAiService.js';

const sampleResume = `Jane Jobscan
Senior Content Marketing Manager
fakeemail@mail.com | 123-456-7890

PROFESSIONAL SUMMARY
Results-oriented content marketing manager with 8 years of digital media experience.

WORK EXPERIENCE
Senior Content Marketing Manager, ACME
June 2022 - Present
- Led B2C content marketing strategy across blogs and social media.
- Increased revenue by 20% through data-backed insights.

EDUCATION
Bachelor of Arts in Marketing, State University

SKILLS
Content Strategy, SEO, Google Analytics, Agile, Project Management`;

const sampleJobDescription = `Senior Digital Content Manager

Requirements:
- 5+ years content marketing experience
- Content strategy and B2B content marketing
- Google Analytics 4 (GA4)
- SEO and integrated campaigns
- Brand marketing and project management tools
- Excellent communication skills`;

const main = async () => {
  const result = await analyzeResumeAgainstJob({
    resumeText: sampleResume,
    jobDescriptionText: sampleJobDescription,
    structuredSections: {},
  });

  console.log(
    JSON.stringify(
      {
        provider: result.provider,
        score: result.score,
        matchedSkillIds: result.matchedSkillIds,
        missingSkillIds: result.missingSkillIds,
        suggestionCount: result.suggestions.length,
        firstSuggestion: result.suggestions[0] || null,
        scoreBreakdown: result.scoreBreakdown,
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error('[resume-scanner-groq-sanity] Failed:', error.message);
  process.exit(1);
});
