import fs from 'fs';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export const cleanExtractedText = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const extractTextFromPDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });

  try {
    const result = await parser.getText();
    return result.text || '';
  } finally {
    await parser.destroy();
  }
};

const extractTextFromDOCX = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || '';
};

export const extractTextFromResume = async (filePath, mimeType) => {
  let extractedText = '';

  switch (mimeType) {
    case 'application/pdf':
      extractedText = await extractTextFromPDF(filePath);
      break;
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      extractedText = await extractTextFromDOCX(filePath);
      break;
    default:
      throw new Error('Unsupported file type');
  }

  return cleanExtractedText(extractedText);
};

export const validateExtractedText = (text) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!text || text.length === 0) {
    result.isValid = false;
    result.errors.push('No text could be extracted from the file');
    return result;
  }

  if (text.length < 50) {
    result.warnings.push('Extracted text seems very short. The resume might not be processed correctly.');
  }

  if (text.length > 50000) {
    result.warnings.push('Extracted text is very long. This might affect processing speed.');
  }

  const resumeKeywords = [
    'experience',
    'education',
    'skills',
    'objective',
    'summary',
    'work',
    'job',
    'employment',
    'degree',
    'university',
    'college',
  ];

  const textLower = text.toLowerCase();
  const foundKeywords = resumeKeywords.filter((keyword) => textLower.includes(keyword));

  if (foundKeywords.length < 3) {
    result.warnings.push('The document might not be a resume based on content analysis.');
  }

  return result;
};

export const getFileInfo = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      exists: true,
    };
  } catch {
    return {
      size: 0,
      created: null,
      modified: null,
      exists: false,
    };
  }
};
