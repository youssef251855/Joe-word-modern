import { JoedDocument, JoedMetadata, ShapeItem } from '../types/shapes';

/**
 * Extracts and converts all images in HTML to embedded base64 data URLs in assets map
 */
export async function embedImagesInHtml(html: string): Promise<{ cleanHtml: string; assets: Record<string, string> }> {
  const assets: Record<string, string> = {};
  if (typeof window === 'undefined') {
    return { cleanHtml: html, assets };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const imgElements = doc.querySelectorAll('img');

  for (let i = 0; i < imgElements.length; i++) {
    const img = imgElements[i];
    const src = img.getAttribute('src');
    if (!src) continue;

    const assetId = `img_asset_${i}_${Date.now()}`;
    
    // If it's already a data URL
    if (src.startsWith('data:')) {
      assets[assetId] = src;
      img.setAttribute('data-asset-id', assetId);
    } else {
      // Try to fetch external or blob image and convert to base64
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        assets[assetId] = base64;
        img.setAttribute('src', base64);
        img.setAttribute('data-asset-id', assetId);
      } catch (err) {
        console.warn(`Could not embed image ${src} to base64:`, err);
        assets[assetId] = src;
        img.setAttribute('data-asset-id', assetId);
      }
    }
  }

  return {
    cleanHtml: doc.body.innerHTML,
    assets
  };
}

/**
 * Creates a valid, complete JOED document structure
 */
export async function createJoedDocument(params: {
  title: string;
  content: string;
  shapes: ShapeItem[];
  pageLayout: {
    margins: 'normal' | 'narrow' | 'wide';
    orientation: 'portrait' | 'landscape';
  };
  language?: string;
  direction?: 'rtl' | 'ltr';
}): Promise<JoedDocument> {
  const now = new Date().toISOString();
  
  // Ensure all images are reliably stored
  const { cleanHtml, assets } = await embedImagesInHtml(params.content);

  const metadata: JoedMetadata = {
    format: 'JOED',
    version: '1.0',
    title: params.title || 'مستند Joe Word',
    createdAt: now,
    updatedAt: now,
    language: params.language || 'ar',
    direction: params.direction || 'rtl',
    generator: 'Joe Word Engine 2.0'
  };

  return {
    format: 'JOED',
    version: '1.0',
    metadata,
    pageLayout: {
      margins: params.pageLayout.margins,
      orientation: params.pageLayout.orientation,
      pageSize: 'A4'
    },
    content: cleanHtml,
    shapes: params.shapes || [],
    assets,
    settings: {
      fontFamily: 'Cairo',
      fontSize: 14,
      showRuler: false,
      showGrid: false
    }
  };
}

/**
 * Serializes a JoedDocument into a UTF-8 JSON string with proper metadata
 */
export function serializeJoed(doc: JoedDocument): string {
  return JSON.stringify(doc, null, 2);
}

/**
 * Sanitizes HTML content to remove any potentially dangerous script tags or inline handlers
 */
export function sanitizeHtml(rawHtml: string): string {
  if (typeof window === 'undefined') return rawHtml;
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Remove script tags, iframes, objects, embeds
  const dangerousTags = doc.querySelectorAll('script, iframe, object, embed, applet, meta, link');
  dangerousTags.forEach(el => el.remove());

  // Remove dangerous attributes like onerror, onclick, etc.
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      if (attr.name.toLowerCase().startsWith('on') || attr.value.toLowerCase().includes('javascript:')) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return doc.body.innerHTML;
}

/**
 * Safely parses and validates a JOED file content
 */
export function parseJoed(jsonString: string): { success: boolean; document?: JoedDocument; error?: string } {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return { success: false, error: 'الملف فارغ أو غير صالح.' };
    }

    const parsed = JSON.parse(jsonString);

    // Format validation
    if (parsed.format !== 'JOED' && parsed.metadata?.format !== 'JOED') {
      return { 
        success: false, 
        error: 'صيغة الملف غير متوافقة. الملف ليس مستند JOED صالح.' 
      };
    }

    // Version check
    const version = parsed.version || parsed.metadata?.version || '1.0';
    const majorVersion = parseInt(version.split('.')[0], 10);
    if (isNaN(majorVersion) || majorVersion > 1) {
      console.warn(`Opening newer JOED version ${version}. Will attempt backward-compatible recovery.`);
    }

    // Reconstruct valid document with safe fallbacks
    const title = parsed.metadata?.title || parsed.title || 'مستند Joe Word المستعاد';
    const content = sanitizeHtml(parsed.content || '');
    const shapes: ShapeItem[] = Array.isArray(parsed.shapes) ? parsed.shapes.map((s: any, idx: number) => ({
      id: s.id || `shape-${idx}-${Date.now()}`,
      type: s.type || 'rectangle',
      x: typeof s.x === 'number' ? s.x : 50,
      y: typeof s.y === 'number' ? s.y : 50,
      width: typeof s.width === 'number' ? s.width : 120,
      height: typeof s.height === 'number' ? s.height : 80,
      rotation: typeof s.rotation === 'number' ? s.rotation : 0,
      fill: s.fill || '#3b82f6',
      stroke: s.stroke || '#1d4ed8',
      strokeWidth: typeof s.strokeWidth === 'number' ? s.strokeWidth : 2,
      strokeStyle: s.strokeStyle || 'solid',
      opacity: typeof s.opacity === 'number' ? s.opacity : 1,
      zIndex: typeof s.zIndex === 'number' ? s.zIndex : idx + 1,
      groupId: s.groupId || null,
      text: s.text || '',
      textStyle: s.textStyle || {
        fontSize: 14,
        fontFamily: 'Cairo',
        color: '#ffffff',
        bold: false,
        italic: false,
        underline: false,
        align: 'center'
      },
      textWrap: s.textWrap || 'in-front',
      pageIndex: typeof s.pageIndex === 'number' ? s.pageIndex : 0
    })) : [];

    const pageLayout = {
      margins: (parsed.pageLayout?.margins === 'narrow' || parsed.pageLayout?.margins === 'wide') ? parsed.pageLayout.margins : 'normal',
      orientation: parsed.pageLayout?.orientation === 'landscape' ? 'landscape' : 'portrait',
      pageSize: parsed.pageLayout?.pageSize || 'A4'
    } as const;

    const validatedDoc: JoedDocument = {
      format: 'JOED',
      version: '1.0',
      metadata: {
        format: 'JOED',
        version: '1.0',
        title,
        createdAt: parsed.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language: parsed.metadata?.language || 'ar',
        direction: parsed.metadata?.direction || 'rtl',
        generator: parsed.metadata?.generator || 'Joe Word Engine 2.0'
      },
      pageLayout,
      content,
      shapes,
      assets: parsed.assets || {},
      settings: parsed.settings || {}
    };

    return { success: true, document: validatedDoc };
  } catch (err: any) {
    console.error('Error parsing JOED document:', err);
    return { 
      success: false, 
      error: `فشل فتح ملف JOED. قد يكون الملف تالفاً أو غير مكتمل: ${err.message || String(err)}` 
    };
  }
}

/**
 * Downloads document as .joed file to the user machine
 */
export function downloadJoedFile(doc: JoedDocument, filename?: string) {
  const jsonContent = serializeJoed(doc);
  const cleanTitle = (filename || doc.metadata.title || 'document').replace(/[\\/:*?"<>|]/g, '_').trim();
  const fullFileName = cleanTitle.endsWith('.joed') ? cleanTitle : `${cleanTitle}.joed`;

  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fullFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converts document content + shapes into formatted Markdown (.md)
 */
export function convertToMarkdown(htmlContent: string, shapes: ShapeItem[] = []): string {
  if (typeof window === 'undefined') return htmlContent;
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  let md = '';

  // Process nodes
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node instanceof HTMLElement) {
      const tag = node.tagName.toLowerCase();
      const inner = Array.from(node.childNodes).map(processNode).join('');

      switch (tag) {
        case 'h1': return `\n# ${inner}\n\n`;
        case 'h2': return `\n## ${inner}\n\n`;
        case 'h3': return `\n### ${inner}\n\n`;
        case 'h4': return `\n#### ${inner}\n\n`;
        case 'h5': return `\n##### ${inner}\n\n`;
        case 'h6': return `\n###### ${inner}\n\n`;
        case 'p': return `\n${inner}\n`;
        case 'strong':
        case 'b': return `**${inner}**`;
        case 'em':
        case 'i': return `*${inner}*`;
        case 'u': return `<u>${inner}</u>`;
        case 's':
        case 'strike': return `~~${inner}~~`;
        case 'blockquote': return `\n> ${inner.trim()}\n\n`;
        case 'ul': return `\n${inner}\n`;
        case 'ol': return `\n${inner}\n`;
        case 'li': return `- ${inner}\n`;
        case 'hr': return `\n---\n`;
        case 'img': {
          const alt = node.getAttribute('alt') || 'صورة';
          const src = node.getAttribute('src') || '';
          return `\n![${alt}](${src})\n`;
        }
        case 'a': {
          const href = node.getAttribute('href') || '#';
          return `[${inner}](${href})`;
        }
        case 'table': {
          const rows = Array.from(node.querySelectorAll('tr'));
          if (rows.length === 0) return '';
          let tableMd = '\n';
          rows.forEach((row, rIdx) => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            const rowText = '| ' + cells.map(c => c.textContent?.trim() || ' ').join(' | ') + ' |\n';
            tableMd += rowText;
            if (rIdx === 0) {
              tableMd += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
            }
          });
          return tableMd + '\n';
        }
        default: return inner;
      }
    }
    return '';
  };

  md = Array.from(doc.body.childNodes).map(processNode).join('');

  // Add shapes section if present
  if (shapes.length > 0) {
    md += '\n\n---\n### 🎨 الأشكال والمخططات (Shapes):\n';
    shapes.forEach((s, i) => {
      md += `- **شكل ${i + 1}**: ${s.type} ${s.text ? `(نص: "${s.text}")` : ''} - الحجم: ${Math.round(s.width)}x${Math.round(s.height)}px\n`;
    });
  }

  return md.trim();
}

/**
 * Exports document as standalone HTML with embedded styles and shapes
 */
export function exportToStandaloneHtml(params: {
  title: string;
  content: string;
  shapes: ShapeItem[];
  pageLayout: { orientation: 'portrait' | 'landscape'; margins: string };
}) {
  const isLandscape = params.pageLayout.orientation === 'landscape';
  const cleanTitle = (params.title || 'مستند Joe Word').replace(/[\\/:*?"<>|]/g, '_').trim();

  // Render SVG shapes overlay
  let shapesHtml = '';
  if (params.shapes && params.shapes.length > 0) {
    shapesHtml = `
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;">
      <svg width="100%" height="100%" style="overflow: visible;">
        ${params.shapes.map(s => {
          return `<g transform="translate(${s.x}, ${s.y}) rotate(${s.rotation} ${s.width/2} ${s.height/2})" opacity="${s.opacity}">
            <rect width="${s.width}" height="${s.height}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" rx="${s.type === 'rounded-rectangle' ? 12 : 0}" />
            ${s.text ? `<text x="${s.width/2}" y="${s.height/2 + 5}" fill="${s.textStyle?.color || '#ffffff'}" font-size="${s.textStyle?.fontSize || 14}px" font-family="${s.textStyle?.fontFamily || 'Cairo'}" text-anchor="middle" font-weight="${s.textStyle?.bold ? 'bold' : 'normal'}">${s.text}</text>` : ''}
          </g>`;
        }).join('')}
      </svg>
    </div>`;
  }

  const fullHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>${cleanTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
    body {
      font-family: 'Cairo', Arial, sans-serif;
      background-color: #f1f5f9;
      margin: 0;
      padding: 30px 10px;
      direction: rtl;
      color: #1e293b;
    }
    .page-container {
      max-width: ${isLandscape ? '1100px' : '820px'};
      margin: 0 auto;
      background: #ffffff;
      padding: ${params.pageLayout.margins === 'narrow' ? '30px' : '60px'};
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border-radius: 8px;
      position: relative;
      min-height: 800px;
      line-height: 1.7;
    }
    h1 { font-size: 28px; color: #0f172a; margin-top: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h2 { font-size: 22px; color: #1e293b; margin-top: 20px; }
    h3 { font-size: 18px; color: #334155; }
    p { margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; }
    th { background: #f8fafc; font-weight: bold; }
    blockquote { border-right: 4px solid #6366f1; padding-right: 14px; margin: 14px 0; color: #475569; background: #f8fafc; padding: 8px 14px; }
    img { max-width: 100%; height: auto; border-radius: 6px; }
    .page-break { page-break-after: always; height: 1px; border: none; border-top: 2px dashed #cbd5e1; margin: 40px 0; }
    @media print {
      body { background: transparent; padding: 0; }
      .page-container { box-shadow: none; padding: 0; max-width: 100%; }
      .page-break { page-break-after: always; visibility: hidden; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    ${params.content}
    ${shapesHtml}
  </div>
</body>
</html>`;

  return fullHtml;
}

/**
 * Downloads document as standalone HTML file (.html)
 */
export function downloadHtmlFile(params: {
  title: string;
  content: string;
  shapes: ShapeItem[];
  pageLayout: { orientation: 'portrait' | 'landscape'; margins: string };
}) {
  const cleanTitle = (params.title || 'مستند Joe Word').replace(/[\\/:*?"<>|]/g, '_').trim();
  const fullHtml = exportToStandaloneHtml(params);
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanTitle}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports document as Markdown file (.md)
 */
export function downloadMarkdownFile(content: string, shapes: ShapeItem[], title: string = 'document') {
  const md = convertToMarkdown(content, shapes);
  const cleanTitle = title.replace(/[\\/:*?"<>|]/g, '_').trim() || 'document';
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanTitle}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
