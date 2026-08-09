import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const files = [
  'frontend/src/pages/ResumeScanner/ResumeScannerUploadPage.jsx',
  'frontend/src/pages/ResumeScanner/ResumeScannerAnalysisPage.jsx',
  'frontend/src/features/resumeScanner/components/AnalyzeOverlay.jsx',
  'frontend/src/features/resumeScanner/components/ResumeEditor.jsx',
  'frontend/src/features/resumeScanner/components/StructuredResumeView.jsx',
  'frontend/src/features/resumeScanner/components/RewriteComparisonPanel.jsx',
  'frontend/src/features/resumeScanner/components/ScannerSectionEditor.jsx',
  'frontend/src/features/resumeScanner/components/SkillsSidebar.jsx',
  'frontend/src/features/resumeScanner/components/DualScoreHeader.jsx',
  'frontend/src/features/resumeScanner/components/AtsScoreGauge.jsx',
  'frontend/src/features/resumeScanner/components/SuggestionToolbar.jsx',
  'frontend/src/features/resumeScanner/components/SuggestionPopover.jsx',
  'frontend/src/features/resumeScanner/hooks/useResumeScanner.js',
  'frontend/src/features/resumeScanner/services/resumeScannerService.js',
  'frontend/src/features/resumeScanner/utils/resumeEditorUtils.js',
  'frontend/src/features/resumeScanner/utils/structuredResumeUtils.js',
  'frontend/src/features/resumeScanner/utils/structuredResumeBuilderUtils.js',
  'frontend/src/i18n/locales/en/resumeScanner.json',
  'frontend/src/i18n/locales/es/resumeScanner.json',
  'frontend/src/i18n/locales/ur/resumeScanner.json',
  'frontend/src/App.jsx',
  'backend/src/routes/resumeScannerRoutes.js',
  'backend/src/controllers/resumeScannerController.js',
  'backend/src/middleware/resumeScannerUploadMiddleware.js',
  'backend/src/middleware/resumeScannerRateLimiters.js',
  'backend/src/validators/resumeScannerValidators.js',
  'backend/src/models/AtsAnalysis.js',
  'backend/src/models/ScannedResume.js',
  'backend/src/models/JobDescription.js',
  'backend/src/utils/structuredResume.js',
  'backend/src/utils/resumeScannerSectionDetect.js',
  'backend/src/utils/resumeScannerExtractionService.js',
  'backend/src/utils/resumeScannerAiService.js',
  'backend/src/utils/resumeScannerGroqService.js',
  'backend/src/utils/resumeScannerClaudeService.js',
  'backend/src/utils/resumeScannerPrompts.js',
  'backend/src/utils/resumeScannerSchemas.js',
  'backend/src/utils/resumeScannerScoring.js',
  'backend/src/utils/resumeScannerMismatch.js',
  'backend/src/utils/resumeScannerRewriteService.js',
  'backend/src/utils/resumeScannerRewriteSchemas.js',
  'backend/src/utils/resumeScannerRewriteValidation.js',
  'backend/src/utils/resumeScannerLlmTimeouts.js',
  'backend/src/utils/resumeScannerJson.js',
  'backend/src/utils/resumeScannerPipeline/index.js',
  'backend/src/utils/resumeScannerPipeline/understandPass.js',
  'backend/src/utils/resumeScannerPipeline/factsPass.js',
  'backend/src/utils/resumeScannerPipeline/jdPass.js',
  'backend/src/utils/resumeScannerPipeline/similarityPass.js',
  'backend/src/utils/resumeScannerPipeline/decidePass.js',
  'backend/src/utils/resumeScannerPipeline/planPass.js',
  'backend/src/utils/resumeScannerPipeline/rewritePass.js',
  'backend/src/utils/resumeScannerPipeline/validatePass.js',
  'backend/src/utils/resumeScannerPipeline/llmClient.js',
  'backend/src/utils/resumeScannerPipeline/decisionEngine.js',
  'backend/src/utils/resumeScannerPipeline/decisionContext.js',
  'backend/src/utils/resumeScannerPipeline/validation/index.js',
  'backend/src/utils/resumeScannerPipeline/validation/textMetrics.js',
  'backend/src/services/resumeScanner/resumeScannerOrchestrator.js',
  'backend/src/services/resumeScanner/jobService.js',
  'backend/src/services/resumeScanner/optimizeService.js',
  'backend/src/services/resumeScanner/rewriteLifecycleService.js',
  'backend/src/services/resumeScanner/finalizeService.js',
  'backend/src/services/resumeScanner/pdfService.js',
  'backend/src/services/resumeScanner/structureService.js',
  'backend/src/services/resumeScanner/analysisPersistence.js',
  'backend/src/utils/resumeScannerParsedData.js',
  'backend/src/utils/resumeScannerTextUtils.js',
  'backend/src/utils/resumeScannerHistory.js',
  'backend/src/utils/resumeScannerSerializer.js',
  'backend/src/utils/resumeLineMapUtils.js',
  'backend/src/utils/pythonExtractorService.js',
  'backend/src/utils/resumeFileExtractor.js',
  'backend/src/app.js',
  'python-service/main.py',
  'python-service/extractor.py',
  'python-service/ats_normalizer.py',
  'python-service/resume_extractor.py',
  'python-service/cleaner.py',
  'python-service/chunker.py',
  'python-service/platform_config.py',
  'python-service/requirements.txt',
  'python-service/.env.example',
];

const sections = [
  { title: '1. FRONTEND — Pages', start: 0, end: 2 },
  { title: '2. FRONTEND — Components', start: 2, end: 11 },
  { title: '3. FRONTEND — Hooks, Services, Utils', start: 11, end: 15 },
  { title: '4. FRONTEND — i18n', start: 15, end: 18 },
  { title: '5. FRONTEND — App Routes', start: 18, end: 19 },
  { title: '6. BACKEND — Routes & Controller', start: 19, end: 21 },
  { title: '7. BACKEND — Middleware & Validators', start: 21, end: 24 },
  { title: '8. BACKEND — Models', start: 24, end: 27 },
  { title: '9. BACKEND — Utils', start: 27, end: 40 },
  { title: '10. BACKEND — App Mount', start: 40, end: 41 },
  { title: '11. PYTHON SERVICE', start: 41, end: files.length },
];

const fence = '```';

function langFor(rel) {
  const ext = path.extname(rel);
  if (ext === '.jsx') return 'jsx';
  if (ext === '.js') return 'javascript';
  if (ext === '.py') return 'python';
  if (ext === '.json') return 'json';
  return 'text';
}

let out = '# Resume Scanner — Full Code Dump (Frontend + Backend + Python)\n\n';
out += `Generated: ${new Date().toISOString()}\n\n`;
out += '## Index\n\n';

for (let i = 0; i < files.length; i++) {
  const rel = files[i];
  if (fs.existsSync(path.join(root, rel))) {
    out += `${i + 1}. \`${rel}\`\n`;
  }
}

out += '\n---\n\n';

for (const section of sections) {
  out += `## ${section.title}\n\n`;
  for (let i = section.start; i < section.end; i++) {
    const rel = files[i];
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) continue;
    const lang = langFor(rel);
    const content = fs.readFileSync(full, 'utf8');
    out += `### FILE: \`${rel}\`\n\n`;
    out += `${fence}${lang}\n${content}\n${fence}\n\n`;
  }
}

const outPath = path.join(root, 'RESUME_SCANNER_CODE_DUMP.md');
fs.writeFileSync(outPath, out, 'utf8');
console.log(`Written ${outPath} (${out.split('\n').length} lines, ${files.length} files)`);
