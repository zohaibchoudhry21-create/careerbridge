import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import AtsAnalysis from '../src/models/AtsAnalysis.js';
import {
  generateAtsText,
  hasStructuredResumeData,
  parseAtsTextToStructured,
  structuredResumeToSections,
} from '../src/utils/structuredResume.js';

dotenv.config();

const dryRun = process.argv.includes('--dry-run');

await connectDB();

const cursor = AtsAnalysis.find({}).cursor();
let scanned = 0;
let updated = 0;
let skipped = 0;

for await (const analysis of cursor) {
  scanned += 1;

  if (hasStructuredResumeData(analysis.structuredResume)) {
    skipped += 1;
    continue;
  }

  const structured = parseAtsTextToStructured(analysis.resumeText || '');
  const resumeText = generateAtsText(structured) || analysis.resumeText || '';
  const structuredSections = structuredResumeToSections(structured);

  if (dryRun) {
    updated += 1;
    continue;
  }

  analysis.structuredResume = structured;
  analysis.resumeText = resumeText;
  analysis.structuredSections = structuredSections;
  analysis.markModified('structuredResume');
  analysis.markModified('structuredSections');
  await analysis.save();
  updated += 1;
}

console.log(
  JSON.stringify(
    {
      dryRun,
      scanned,
      updated,
      skipped,
    },
    null,
    2
  )
);

process.exit(0);
