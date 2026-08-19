/**
 * High-performance, clean document printing & PDF export utility.
 * Renders the document in an isolated iframe with precise print styles,
 * enabling instantaneous "Save as PDF" / Print without lag or memory issues.
 */

export interface PrintOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  margins?: 'normal' | 'narrow' | 'wide';
}

export function printDocument(contentHtml: string, options: PrintOptions = {}) {
  const {
    title = 'مستند',
    orientation = 'portrait',
    margins = 'normal'
  } = options;

  let marginCss = '15mm';
  if (margins === 'narrow') {
    marginCss = '8mm';
  } else if (margins === 'wide') {
    marginCss = '25mm';
  }

  // Create isolated iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('title', 'طباعة المستند');

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    // Fallback if iframe document is not accessible
    window.print();
    return;
  }

  const safeTitle = title || 'مستند بدون عنوان';

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${safeTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 ${orientation};
            margin: ${marginCss};
          }
          *, *::before, *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #1e293b;
            font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
            font-size: 15px;
            line-height: 1.7;
            direction: rtl;
            text-align: right;
            -webkit-font-smoothing: antialiased;
          }
          .print-wrapper {
            width: 100%;
            margin: 0 auto;
            background: #ffffff !important;
            direction: rtl;
            text-align: right;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #0f172a;
            font-weight: 700;
            margin-top: 1.2em;
            margin-bottom: 0.5em;
            page-break-after: avoid;
            break-after: avoid;
            line-height: 1.3;
          }
          h1 { font-size: 26px; }
          h2 { font-size: 22px; }
          h3 { font-size: 18px; }
          h4 { font-size: 16px; }
          p {
            margin-top: 0;
            margin-bottom: 0.9em;
            orphans: 3;
            widows: 3;
          }
          img {
            max-width: 100% !important;
            height: auto !important;
            page-break-inside: avoid;
            break-inside: avoid;
            border-radius: 6px;
            display: block;
            margin: 12px auto;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 1.2em 0 !important;
            page-break-inside: avoid;
            break-inside: avoid;
            font-size: 14px;
          }
          table td, table th {
            border: 1px solid #cbd5e1 !important;
            padding: 8px 12px !important;
            text-align: right !important;
          }
          table th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
          }
          blockquote {
            border-right: 4px solid #6366f1;
            padding: 8px 16px;
            margin: 1em 0;
            background: #f8fafc;
            font-style: italic;
          }
          ul, ol {
            padding-right: 24px;
            padding-left: 0;
            margin-bottom: 1em;
          }
          li {
            margin-bottom: 0.4em;
          }
          .page-break, hr.page-break {
            display: block !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            page-break-after: always !important;
            break-after: page !important;
            visibility: hidden !important;
          }
          .book-cover-container {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 85vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 40px;
            margin: 20px auto;
            background-color: #fafafa !important;
          }
        </style>
      </head>
      <body>
        <div class="print-wrapper ql-editor">
          ${contentHtml}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Wait for resources / fonts to settle then invoke print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print blocked, falling back to window.print():', err);
      window.print();
    } finally {
      // Clean up iframe after printing dialog closes
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 45000);
    }
  }, 250);
}
