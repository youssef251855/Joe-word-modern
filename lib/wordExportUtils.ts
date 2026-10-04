export function exportToWord(contentHtml: string, title: string = 'مستند بدون عنوان', options?: { orientation?: 'portrait' | 'landscape' }) {
  const isLandscape = options?.orientation === 'landscape';
  const pageMargin = '2.54cm'; // 1 inch standard Word margin
  
  const cleanTitle = title.trim() || 'مستند بدون عنوان';

  // Build Office XML / MSO HTML format with UTF-8 BOM
  const wordDocumentHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" 
      xmlns="http://www.w3.org/TR/REC-html40" 
      dir="rtl" 
      lang="ar">
<head>
  <meta charset="utf-8">
  <title>${cleanTitle}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page WordSection1 {
      size: ${isLandscape ? '11.0in 8.5in' : '8.5in 11.0in'};
      margin: ${pageMargin} ${pageMargin} ${pageMargin} ${pageMargin};
      mso-header-margin: 0.5in;
      mso-footer-margin: 0.5in;
      mso-paper-source: 0;
    }
    div.WordSection1 {
      page: WordSection1;
    }
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      direction: rtl;
      text-align: right;
      color: #1e293b;
      background-color: #ffffff;
    }
    h1 { font-size: 24pt; color: #0f172a; font-weight: 800; margin-top: 20pt; margin-bottom: 10pt; line-height: 1.3; }
    h2 { font-size: 18pt; color: #1e293b; font-weight: 700; margin-top: 16pt; margin-bottom: 8pt; line-height: 1.4; }
    h3 { font-size: 14pt; color: #334155; font-weight: 700; margin-top: 12pt; margin-bottom: 6pt; }
    h4 { font-size: 12pt; color: #475569; font-weight: bold; margin-top: 10pt; margin-bottom: 4pt; }
    p { margin-top: 0; margin-bottom: 10pt; text-align: justify; }
    ul, ol { margin-top: 0; margin-bottom: 10pt; padding-right: 24pt; }
    li { margin-bottom: 4pt; }
    table { border-collapse: collapse; width: 100%; margin-top: 14pt; margin-bottom: 14pt; direction: rtl; }
    td, th { border: 1px solid #cbd5e1; padding: 8pt 10pt; text-align: right; vertical-align: top; }
    th { background-color: #f8fafc; font-weight: bold; color: #0f172a; border-bottom: 2px solid #94a3b8; }
    blockquote { border-right: 4px solid #6366f1; padding-right: 14pt; margin-right: 0; margin-left: 0; color: #475569; font-style: italic; background-color: #f8fafc; padding-top: 6pt; padding-bottom: 6pt; }
    img { max-width: 100%; height: auto; display: block; margin: 12pt auto; border-radius: 6px; }
    .page-break { page-break-before: always; mso-break-type: page-break; clear: both; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 16pt 0; }
    .book-cover-container { text-align: center; margin: 0 auto 30pt; padding: 40pt 20pt; border: 2px dashed #cbd5e1; background-color: #fafaf9; }
  </style>
</head>
<body>
  <div class="WordSection1">
    ${contentHtml}
  </div>
</body>
</html>`;

  // Create UTF-8 BOM Blob for MS Word compatibility
  const blob = new Blob(['\uFEFF' + wordDocumentHtml], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8'
  });

  const fileName = `${cleanTitle}.docx`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
