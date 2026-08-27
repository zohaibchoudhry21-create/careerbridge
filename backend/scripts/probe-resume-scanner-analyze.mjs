/**
 * Step 4 reliability probe for resume scanner Groq analyze (json_schema).
 * Usage: node scripts/probe-resume-scanner-analyze.mjs
 */
import 'dotenv/config';
import { getGroqConfig } from '../src/config/groqConfig.js';
import { analyzeResumeWithGroq } from '../src/utils/resumeScannerGroqService.js';

const SHORT = {
  label: 'short',
  resumeText:
    'Jane Doe\nSoftware Engineer\nSkills: JavaScript, React, Node.js\nExperience: Built web apps at Acme (2020-2024). Delivered REST APIs and React dashboards.',
  jobDescriptionText:
    'We need a React developer with JavaScript and Node.js experience. REST APIs and dashboards preferred.',
  jobTitle: 'Frontend Developer',
};

const COMPLEX = {
  label: 'complex',
  resumeText: `ALEX MORGAN
Senior Full-Stack Engineer | alex.morgan@email.com | +1-555-0100 | LinkedIn: /in/alexmorgan

PROFESSIONAL SUMMARY
Results-driven engineer with 8+ years building scalable web platforms across fintech and SaaS.
Strong in TypeScript, React, Node.js, PostgreSQL, AWS, and CI/CD. Led teams of 5–8 engineers.

SKILLS
Languages: TypeScript, JavaScript, Python, SQL
Frontend: React, Next.js, Redux, Tailwind CSS, accessibility (WCAG)
Backend: Node.js, Express, NestJS, GraphQL, REST
Cloud/DevOps: AWS (ECS, Lambda, S3, RDS), Docker, Kubernetes, Terraform, GitHub Actions
Data: PostgreSQL, Redis, Elasticsearch, Prisma, MongoDB
Practices: System design, mentorship, agile, incident response, observability (Datadog)

EXPERIENCE
Staff Software Engineer — Northwind Payments (2021–Present)
• Owned checkout microservice handling $40M+ monthly GMV; reduced p99 latency 35% via caching and query tuning
• Migrated monolith modules to event-driven Node services on ECS; cut deploy time from 45m to 8m
• Mentored 6 engineers; instituted design docs and on-call rotations that dropped Sev-1 incidents 50%
• Built React admin console for fraud ops; improved agent throughput 22%

Senior Software Engineer — Contoso Analytics (2018–2021)
• Delivered real-time dashboards in React + WebSockets for 12k concurrent users
• Designed GraphQL gateway over PostgreSQL/Redis; reduced client over-fetching 40%
• Introduced CI pipelines and Dockerized services; improved release cadence from monthly to weekly

Software Engineer — Fabrikam Labs (2016–2018)
• Developed REST APIs in Node.js and Python for B2B integrations
• Collaborated with design on responsive UI components and unit testing culture

EDUCATION
B.S. Computer Science — State University (2016)

CERTIFICATIONS
AWS Solutions Architect – Associate`,
  jobDescriptionText: `About the role
We are hiring a Senior Full-Stack Engineer to own customer-facing product surfaces and backend services.

Requirements (must-have)
• 5+ years professional software engineering
• Expert TypeScript and modern React (hooks, Next.js a plus)
• Strong Node.js backend experience (Express/Nest) and relational databases (PostgreSQL)
• Production experience with AWS, Docker, and CI/CD
• Ability to lead design reviews and mentor mid-level engineers
• Excellent communication with product and design partners

Nice to have
• GraphQL, Redis, Kubernetes, Terraform
• Fintech or payments domain experience
• Observability tooling (Datadog/New Relic)
• Accessibility and performance optimization

Responsibilities
• Design and ship end-to-end features across React and Node services
• Improve reliability and latency of critical payment/checkout paths
• Partner with security and fraud teams on operational tooling
• Raise engineering bar through documentation and code review`,
  jobTitle: 'Senior Full-Stack Engineer',
};

const runOnce = async (fixture, runIndex) => {
  const started = Date.now();
  try {
    const result = await analyzeResumeWithGroq(fixture);
    const ms = Date.now() - started;
    console.log(
      `OK  [${fixture.label} #${runIndex}] ${ms}ms skills=${result.skills?.length} score=${result.score} relevance=${result.jobRelevanceScore}`
    );
    return true;
  } catch (error) {
    const ms = Date.now() - started;
    console.log(
      `FAIL [${fixture.label} #${runIndex}] ${ms}ms message=${error?.message || error}`
    );
    return false;
  }
};

const main = async () => {
  const cfg = getGroqConfig();
  console.log('model=', cfg.model);
  console.log('--- short (1x) ---');
  const shortOk = await runOnce(SHORT, 1);

  console.log('--- complex (4x) ---');
  const complexResults = [];
  for (let i = 1; i <= 4; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    complexResults.push(await runOnce(COMPLEX, i));
  }

  const complexOk = complexResults.filter(Boolean).length;
  console.log('--- summary ---');
  console.log(`short: ${shortOk ? 'PASS' : 'FAIL'}`);
  console.log(`complex: ${complexOk}/4 PASS`);
  process.exit(shortOk && complexOk === 4 ? 0 : 1);
};

main();
