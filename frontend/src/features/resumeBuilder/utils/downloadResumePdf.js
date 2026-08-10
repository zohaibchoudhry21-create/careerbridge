import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Capture a resume preview DOM node and trigger a PDF download.
 * Clones off-screen so hidden responsive previews still render.
 */
export async function downloadResumePdf(element, filename = 'resume.pdf') {
  if (!element) {
    throw new Error('Resume preview not found.');
  }

  const clone = element.cloneNode(true);
  clone.style.display = 'block';
  clone.style.position = 'fixed';
  clone.style.left = '-10000px';
  clone.style.top = '0';
  clone.style.width = `${element.offsetWidth || 794}px`;
  clone.style.background = '#ffffff';
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const imgWidth = A4_WIDTH_MM;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= A4_HEIGHT_MM;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= A4_HEIGHT_MM;
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  } finally {
    document.body.removeChild(clone);
  }
}

export function buildResumePdfFilename(originalFileName, fullName) {
  const base = (originalFileName || fullName || 'resume').replace(/\.[^.]+$/, '').trim();
  return `${base || 'resume'}.pdf`;
}
