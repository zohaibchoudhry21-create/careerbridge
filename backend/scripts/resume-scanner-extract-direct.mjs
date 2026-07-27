#!/usr/bin/env node
/**
 * Direct extraction + optional analysis pipeline test (no HTTP auth required).
 * Usage: node scripts/resume-scanner-extract-direct.mjs [path/to/resume.pdf]
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import AtsAnalysis from '../src/models/AtsAnalysis.js';
import JobDescription from '../src/models/JobDescription.js';
import ScannedResume from '../src/models/ScannedResume.js';
import { extractResumeForScanner } from '../src/utils/resumeScannerExtractionService.js';
import { resolveCanonicalResumeText } from '../src/utils/resumeLineMapUtils.js';
import { analyzeResumeAgainstJob } from '../src/utils/resumeScannerAiService.js';
import { initializeHistory } from '../src/utils/resumeScannerHistory.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultResume = path.resolve(
  __dirname,
  '../../python-service/tests/fixtures/complex-resume.pdf'
);

async function main() {
  const resumePath = path.resolve(process.argv[2] || defaultResume);
  if (!fs.existsSync(resumePath)) {
    console.error(`Resume not found: ${resumePath}`);
    process.exit(1);
  }

  const file = {
    buffer: fs.readFileSync(resumePath),
    originalname: path.basename(resumePath),
    mimetype: 'application/pdf',
    size: fs.statSync(resumePath).size,
  };

  console.log('--- Direct Python extraction via Node service ---');
  const extraction = await extractResumeForScanner(file);
  const canonicalText = resolveCanonicalResumeText({
    resumeText: extraction.extractedText,
    lineMap: extraction.lineMap,
  });

  console.log(
    JSON.stringify(
      {
        extractionSource: extraction.extractionMetadata?.source,
        lineMapLen: extraction.lineMap?.length || 0,
        canonicalFirstLines: canonicalText.split('\n').slice(0, 15),
        lineMapFirstLines: (extraction.lineMap || []).slice(0, 15).map((line) => ({
          n: line.line_number,
          section: line.section_type || null,
          text: line.text,
        })),
      },
      null,
      2
    )
  );

  if (!extraction.lineMap?.length) {
    console.error('FAIL: lineMap is empty — Python extraction did not run.');
    process.exit(1);
  }

  if (process.env.SKIP_ANALYSIS_PIPELINE === '1') {
    return;
  }

  await connectDB();
  const user =
    (await User.findOne({ isVerified: true }).sort({ createdAt: 1 })) ||
    (await User.findOne().sort({ createdAt: 1 }));

  if (!user) {
    console.error('No user in database for pipeline test.');
    process.exit(1);
  }

  const scannedResume = await ScannedResume.create({
    userId: user._id,
    label: path.basename(resumePath),
    sourceFile: extraction.sourceFile,
    extractedText: extraction.extractedText,
    structuredSections: extraction.structuredSections,
    lineMap: extraction.lineMap,
    extractionMetadata: extraction.extractionMetadata,
  });

  const jobDescription = await JobDescription.create({
    userId: user._id,
    rawText: `Hiring Safety Inspector. Requirements: OSHA 30, hazard analysis, incident reporting, PPE audits, root cause analysis, manufacturing safety.`,
  });

  const analysis = await AtsAnalysis.create({
    userId: user._id,
    resumeSourceType: 'scanned',
    resumeSourceId: scannedResume._id,
    jobDescriptionId: jobDescription._id,
    status: 'analyzing',
    progress: 45,
    resumeText: canonicalText,
    originalResumeText: canonicalText,
    structuredSections: extraction.structuredSections,
    lineMap: extraction.lineMap,
  });

  const aiResult = await analyzeResumeAgainstJob({
    resumeText: canonicalText,
    jobDescriptionText: jobDescription.rawText,
    structuredSections: extraction.structuredSections,
  });

  analysis.status = 'completed';
  analysis.progress = 100;
  analysis.atsScore = aiResult.atsScore;
  analysis.jobMatchScore = aiResult.jobMatchScore;
  analysis.score = aiResult.jobMatchScore;
  analysis.atsScoreBreakdown = aiResult.atsScoreBreakdown;
  analysis.jobMatchBreakdown = aiResult.jobMatchBreakdown;
  analysis.matchedSkillIds = aiResult.matchedSkillIds;
  analysis.missingSkillIds = aiResult.missingSkillIds;
  analysis.suggestions = aiResult.suggestions;
  analysis.searchabilityIssues = aiResult.searchabilityIssues;
  analysis.recruiterTips = aiResult.recruiterTips;
  initializeHistory(analysis);
  await analysis.save();

  jobDescription.title = aiResult.jobTitle || 'Safety Inspector';
  jobDescription.company = aiResult.company || '';
  jobDescription.extractedSkills = aiResult.skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    type: skill.type,
    synonyms: skill.synonyms || [],
  }));
  await jobDescription.save();

  console.log('\n--- Analysis created ---');
  console.log(
    JSON.stringify(
      {
        analysisId: String(analysis._id),
        extractionSource: extraction.extractionMetadata?.source,
        lineMapLen: analysis.lineMap.length,
        jobMatchScore: analysis.jobMatchScore,
        atsScore: analysis.atsScore,
        matchedSkills: aiResult.skills.filter((s) => s.matched).map((s) => s.name),
        missingSkills: aiResult.skills.filter((s) => !s.matched).map((s) => s.name).slice(0, 8),
        pendingSuggestions: aiResult.suggestions.filter((s) => s.status === 'pending').length,
        resumeTextFirstLines: analysis.resumeText.split('\n').slice(0, 15),
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
