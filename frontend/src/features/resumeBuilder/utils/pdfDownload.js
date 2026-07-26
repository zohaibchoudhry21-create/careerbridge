export const downloadResumePdf = (elementId = 'resume-preview-document') => {
  const element = document.getElementById(elementId);

  if (!element) {
    window.print();
    return;
  }

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100');

  if (!printWindow) {
    window.print();
    return;
  }

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="ltr">
      <head>
        <title>Resume</title>
        ${styles}
        <style>
          @page { size: A4; margin: 12mm; }
          body { margin: 0; background: white; }
          .resume-print-root { width: 210mm; min-height: 297mm; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="resume-print-root" dir="ltr">${element.innerHTML}</div>
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
