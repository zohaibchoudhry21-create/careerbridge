/**
 * PDF Service — renders a finalized structuredResume to an ATS-friendly PDF.
 * Never accepts suggestions, analysis scores, or unaccepted rewrite payloads.
 */

import PDFDocument from 'pdfkit';
import { generateAtsText, hasStructuredResumeData } from '../../utils/structuredResume.js';

const MARGIN = 50;
const PAGE_WIDTH = 612;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const writeWrapped = (doc, text, options = {}) => {
  const value = String(text || '').trim();
  if (!value) return;
  doc.text(value, { width: CONTENT_WIDTH, ...options });
};

const sectionHeading = (doc, heading) => {
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827');
  writeWrapped(doc, String(heading || '').toUpperCase());
  doc
    .moveTo(MARGIN, doc.y + 2)
    .lineTo(MARGIN + CONTENT_WIDTH, doc.y + 2)
    .strokeColor('#cbd5e1')
    .lineWidth(0.8)
    .stroke();
  doc.moveDown(0.45);
  doc.font('Helvetica').fontSize(10).fillColor('#1f2937');
};

/**
 * Build PDF bytes from a finalized structured resume snapshot.
 * @returns {Promise<Buffer>}
 */
export const generatePdfFromStructuredResume = (structuredResume, { title = 'Resume' } = {}) => {
  if (!hasStructuredResumeData(structuredResume)) {
    throw new Error('FINALIZED_RESUME_EMPTY');
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: MARGIN,
      size: 'LETTER',
      info: {
        Title: title,
        Author: 'AI CareerBridge Resume Scanner',
        Creator: 'AI CareerBridge',
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const resume = structuredResume;
    const contactLine = [resume.contact?.email, resume.contact?.phone, resume.contact?.address]
      .filter(Boolean)
      .join('  |  ');

    doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a');
    writeWrapped(doc, resume.name || 'Resume', { align: 'center' });
    if (contactLine) {
      doc.moveDown(0.25);
      doc.font('Helvetica').fontSize(9).fillColor('#475569');
      writeWrapped(doc, contactLine, { align: 'center' });
    }

    const order =
      Array.isArray(resume.sectionOrder) && resume.sectionOrder.length
        ? resume.sectionOrder
        : [
            { type: 'summary', heading: 'Professional Summary' },
            { type: 'experience', heading: 'Work Experience' },
            { type: 'education', heading: 'Education' },
            { type: 'skills', heading: 'Skills' },
            { type: 'projects', heading: 'Projects' },
            { type: 'certifications', heading: 'Certifications' },
            { type: 'achievements', heading: 'Achievements' },
            { type: 'languages', heading: 'Languages' },
            ...(resume.additionalSections || []).map((s) => ({
              type: s.type,
              heading: s.heading,
            })),
          ];

    const renderedAdditional = new Set();

    for (const section of order) {
      const type = section.type;
      const heading = section.heading || type;

      if (type === 'summary' && resume.summary) {
        sectionHeading(doc, heading);
        writeWrapped(doc, resume.summary);
        continue;
      }

      if (type === 'experience' && resume.workExperience?.length) {
        sectionHeading(doc, heading);
        for (const job of resume.workExperience) {
          doc.font('Helvetica-Bold').fontSize(10);
          writeWrapped(
            doc,
            [job.title, job.company].filter(Boolean).join(' — ')
          );
          if (job.duration) {
            doc.font('Helvetica').fontSize(9).fillColor('#64748b');
            writeWrapped(doc, job.duration);
            doc.fillColor('#1f2937');
          }
          doc.font('Helvetica').fontSize(10);
          for (const bullet of job.bullets || []) {
            if (!String(bullet).trim()) continue;
            writeWrapped(doc, `• ${bullet}`);
          }
          doc.moveDown(0.35);
        }
        continue;
      }

      if (type === 'education' && resume.education?.length) {
        sectionHeading(doc, heading);
        for (const edu of resume.education) {
          doc.font('Helvetica-Bold').fontSize(10);
          writeWrapped(
            doc,
            [edu.degree, edu.institution].filter(Boolean).join(' — ')
          );
          if (edu.duration) {
            doc.font('Helvetica').fontSize(9).fillColor('#64748b');
            writeWrapped(doc, edu.duration);
            doc.fillColor('#1f2937');
          }
          doc.font('Helvetica').fontSize(10);
          doc.moveDown(0.25);
        }
        continue;
      }

      if (type === 'skills' && resume.skills?.length) {
        sectionHeading(doc, heading);
        writeWrapped(doc, resume.skills.filter(Boolean).join(', '));
        continue;
      }

      if (type === 'projects' && resume.projects?.length) {
        sectionHeading(doc, heading);
        for (const project of resume.projects) {
          doc.font('Helvetica-Bold').fontSize(10);
          writeWrapped(doc, project.name || 'Project');
          doc.font('Helvetica').fontSize(10);
          if (project.description) writeWrapped(doc, project.description);
          if (project.technologies?.length) {
            writeWrapped(doc, `Technologies: ${project.technologies.join(', ')}`);
          }
          doc.moveDown(0.25);
        }
        continue;
      }

      if (type === 'certifications' && resume.certifications?.length) {
        sectionHeading(doc, heading);
        for (const cert of resume.certifications) {
          writeWrapped(doc, `• ${cert}`);
        }
        continue;
      }

      if (type === 'achievements' && resume.achievements?.length) {
        sectionHeading(doc, heading);
        for (const item of resume.achievements) {
          writeWrapped(doc, `• ${item}`);
        }
        continue;
      }

      if (type === 'languages' && resume.languages?.length) {
        sectionHeading(doc, heading);
        writeWrapped(doc, resume.languages.filter(Boolean).join(', '));
        continue;
      }

      const additional = (resume.additionalSections || []).find(
        (s) =>
          s.type === type ||
          String(s.heading || '').toLowerCase() === String(heading || '').toLowerCase()
      );
      if (additional && !renderedAdditional.has(additional.heading || additional.type)) {
        renderedAdditional.add(additional.heading || additional.type);
        sectionHeading(doc, additional.heading || heading);
        for (const paragraph of additional.paragraphs || []) {
          writeWrapped(doc, paragraph);
          doc.moveDown(0.2);
        }
      }
    }

    // Safety: if structure was sparse, append ATS text so PDF is never empty
    if (doc.y < MARGIN + 80) {
      sectionHeading(doc, 'Resume');
      writeWrapped(doc, generateAtsText(resume));
    }

    doc.end();
  });
};

export const buildPdfFilename = (structuredResume, analysisId) => {
  const base = String(structuredResume?.name || 'resume')
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const idPart = String(analysisId || '').slice(-6);
  return `${base || 'resume'}-${idPart || 'scan'}.pdf`;
};
