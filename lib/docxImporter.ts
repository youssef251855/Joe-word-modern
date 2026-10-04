import mammoth from 'mammoth';

export interface DocxImportResult {
  success: boolean;
  html: string;
  title: string;
  messages: string[];
  error?: string;
}

/**
 * Imports and converts a Word (.docx) file ArrayBuffer to structured, editable HTML
 */
export async function importDocxFile(file: File): Promise<DocxImportResult> {
  const messages: string[] = [];
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Mammoth options for custom image handling and styling
    const options: any = {
      convertImage: mammoth.images.imgElement((image: any) => {
        return image.read("base64").then((imageBuffer: string) => {
          return {
            src: `data:${image.contentType};base64,${imageBuffer}`
          };
        });
      }),
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Title'] => h1.doc-title:fresh",
        "p[style-name='Subtitle'] => h2.doc-subtitle:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "u => u",
        "strike => s",
        "p[style-name='Quote'] => blockquote:fresh",
        "p[style-name='Intense Quote'] => blockquote.intense:fresh"
      ]
    };

    const result = await mammoth.convertToHtml({ arrayBuffer }, options);
    
    let html = result.value || '';
    if (result.messages && result.messages.length > 0) {
      result.messages.forEach((msg: any) => {
        messages.push(msg.message);
      });
    }

    // Post-process HTML for enhanced Joe Word editing
    if (html.trim() === '') {
      html = '<p>المستند فارغ</p>';
    }

    // Format tables cleanly with default styling if not present
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Ensure table cells have proper padding and borders
    const tables = doc.querySelectorAll('table');
    tables.forEach(table => {
      table.setAttribute('border', '1');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.margin = '16px 0';
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        (cell as HTMLElement).style.padding = '8px 12px';
        (cell as HTMLElement).style.border = '1px solid #cbd5e1';
      });
    });

    // Detect if content is primarily Arabic/RTL
    const textContent = doc.body.textContent || '';
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    const isArabic = arabicRegex.test(textContent);

    if (isArabic) {
      doc.body.setAttribute('dir', 'rtl');
    }

    const processedHtml = doc.body.innerHTML;
    const title = file.name.replace(/\.docx$/i, '').trim() || 'مستند Word مستورد';

    return {
      success: true,
      html: processedHtml,
      title,
      messages
    };

  } catch (err: any) {
    console.error('Error importing DOCX:', err);
    return {
      success: false,
      html: '',
      title: file.name.replace(/\.docx$/i, ''),
      messages: [err.message || String(err)],
      error: `فشل فتح ملف DOCX: ${err.message || 'الملف تالف أو غير متوافق'}`
    };
  }
}
