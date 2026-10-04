import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ShapeItem } from '../types/shapes';
import { printDocument } from './printUtils';

export interface PdfExportOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  margins?: 'normal' | 'narrow' | 'wide';
  shapes?: ShapeItem[];
  onProgress?: (current: number, total: number) => void;
}

/**
 * Converts all images inside an element into base64 data URLs to prevent
 * CORS issues and the dreaded "Tainted canvases may not be exported" error in html2canvas.
 */
async function inlineImagesAsBase64(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      try {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('data:')) {
          // Already base64 or empty
          return;
        }

        // Attempt to fetch as blob with CORS
        const response = await fetch(src, { mode: 'cors' });
        if (!response.ok) return;

        const blob = await response.blob();
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              img.src = reader.result;
            }
            resolve();
          };
          reader.onerror = () => resolve();
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.warn('Could not convert image to base64 for PDF export:', err);
      }
    })
  );
}

/**
 * Builds SVG markup for shapes associated with a page or the entire document.
 */
function renderShapesSvg(shapes: ShapeItem[], width: number, height: number): string {
  if (!shapes || shapes.length === 0) return '';

  const shapeElements = shapes.map((s) => {
    const rx = s.type === 'rounded-rectangle' ? 12 : 0;
    const isCircle = s.type === 'circle' || s.type === 'ellipse';
    const isLine = s.type === 'line';
    const isArrow = s.type === 'arrow' || s.type === 'arrow-left' || s.type === 'double-arrow';
    const isStar = s.type === 'star';
    const isTriangle = s.type === 'triangle';
    const isDiamond = s.type === 'diamond';

    let shapeInner = '';

    if (isCircle) {
      shapeInner = `<ellipse cx="${s.width / 2}" cy="${s.height / 2}" rx="${s.width / 2}" ry="${s.height / 2}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" />`;
    } else if (isTriangle) {
      shapeInner = `<polygon points="${s.width / 2},0 0,${s.height} ${s.width},${s.height}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" />`;
    } else if (isDiamond) {
      shapeInner = `<polygon points="${s.width / 2},0 ${s.width},${s.height / 2} ${s.width / 2},${s.height} 0,${s.height / 2}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" />`;
    } else if (isLine) {
      shapeInner = `<line x1="0" y1="${s.height / 2}" x2="${s.width}" y2="${s.height / 2}" stroke="${s.stroke || s.fill}" stroke-width="${Math.max(s.strokeWidth, 2)}" stroke-dasharray="${s.strokeStyle === 'dashed' ? '6,6' : 'none'}" />`;
    } else {
      shapeInner = `<rect width="${s.width}" height="${s.height}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" rx="${rx}" />`;
    }

    const textElement = s.text
      ? `<text x="${s.width / 2}" y="${s.height / 2 + 5}" fill="${s.textStyle?.color || '#ffffff'}" font-size="${s.textStyle?.fontSize || 14}px" font-family="${s.textStyle?.fontFamily || 'Cairo'}" text-anchor="middle" font-weight="${s.textStyle?.bold ? 'bold' : 'normal'}">${s.text}</text>`
      : '';

    return `
      <g transform="translate(${s.x}, ${s.y}) rotate(${s.rotation || 0} ${s.width / 2} ${s.height / 2})" opacity="${s.opacity ?? 1}">
        ${shapeInner}
        ${textElement}
      </g>
    `;
  });

  return `
    <div style="position: absolute; left: 0; top: 0; width: ${width}px; height: ${height}px; pointer-events: none; z-index: 25;">
      <svg width="${width}" height="${height}" style="overflow: visible;">
        ${shapeElements.join('\n')}
      </svg>
    </div>
  `;
}

/**
 * Splits HTML content into distinct page sections based on <hr class="page-break"> or .page-break
 */
export function splitContentIntoPages(htmlContent: string): string[] {
  if (!htmlContent || !htmlContent.trim()) {
    return ['<p><br></p>'];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const childNodes = Array.from(doc.body.childNodes);

  if (childNodes.length === 0) {
    return [htmlContent];
  }

  const pages: string[] = [];
  let currentPageNodes: Node[] = [];

  for (const node of childNodes) {
    if (
      node instanceof HTMLElement &&
      (node.classList.contains('page-break') ||
        node.tagName === 'HR' ||
        node.getAttribute('data-page-break') === 'true')
    ) {
      if (currentPageNodes.length > 0) {
        const container = document.createElement('div');
        currentPageNodes.forEach((n) => container.appendChild(n.cloneNode(true)));
        pages.push(container.innerHTML);
        currentPageNodes = [];
      }
    } else {
      currentPageNodes.push(node);
    }
  }

  if (currentPageNodes.length > 0) {
    const container = document.createElement('div');
    currentPageNodes.forEach((n) => container.appendChild(n.cloneNode(true)));
    pages.push(container.innerHTML);
  }

  return pages.length > 0 ? pages : [htmlContent];
}

/**
 * High-reliability PDF exporter that produces crisp, multi-page PDFs with Arabic support.
 */
export async function exportDocumentToPdf(
  htmlContent: string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const {
    title = 'مستند Joe Word',
    orientation = 'portrait',
    margins = 'normal',
    shapes = [],
    onProgress
  } = options;

  const isPortrait = orientation === 'portrait';
  // A4 dimensions in px at standard 96 DPI: 794 x 1123
  const widthPx = isPortrait ? 794 : 1123;
  const heightPx = isPortrait ? 1123 : 794;

  // A4 dimensions in mm: 210 x 297
  const pdfW = isPortrait ? 210 : 297;
  const pdfH = isPortrait ? 297 : 210;

  // Padding in pixels based on margins
  let paddingPx = 60;
  if (margins === 'narrow') paddingPx = 30;
  else if (margins === 'wide') paddingPx = 90;

  // Split into pages
  const pageHtmlList = splitContentIntoPages(htmlContent);
  const totalPages = pageHtmlList.length;

  // Create isolated off-screen stage
  const stage = document.createElement('div');
  stage.id = 'pdf-render-stage';
  stage.style.position = 'fixed';
  stage.style.left = '-9999px';
  stage.style.top = '0';
  stage.style.width = `${widthPx}px`;
  stage.style.zIndex = '9999';
  stage.style.pointerEvents = 'none';
  stage.style.opacity = '1';
  stage.style.backgroundColor = '#ffffff';

  // Inject styles for print / PDF
  const styleTag = document.createElement('style');
  styleTag.id = 'pdf-export-style-tag';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
    
    .pdf-page-container {
      width: ${widthPx}px;
      min-height: ${heightPx}px;
      height: ${heightPx}px;
      padding: ${paddingPx}px;
      box-sizing: border-box;
      background-color: #ffffff !important;
      color: #1e293b !important;
      font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif !important;
      direction: rtl !important;
      text-align: right !important;
      position: relative;
      overflow: hidden;
    }
    
    .pdf-page-container * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif !important;
      direction: rtl !important;
      text-align: right !important;
    }
    
    .pdf-page-container h1 { font-size: 26px; font-weight: 700; margin: 16px 0 10px; color: #0f172a; }
    .pdf-page-container h2 { font-size: 21px; font-weight: 700; margin: 14px 0 8px; color: #1e293b; }
    .pdf-page-container h3 { font-size: 18px; font-weight: 600; margin: 12px 0 6px; color: #334155; }
    .pdf-page-container p { font-size: 14.5px; line-height: 1.7; margin: 8px 0; }
    .pdf-page-container img { max-width: 100%; height: auto; display: block; border-radius: 6px; }
    .pdf-page-container table { width: 100%; border-collapse: collapse; margin: 14px 0; }
    .pdf-page-container th, .pdf-page-container td { border: 1px solid #cbd5e1; padding: 8px 12px; }
    .pdf-page-container th { background: #f8fafc; font-weight: bold; }
    .pdf-page-container blockquote { border-right: 4px solid #6366f1; background: #f8fafc; padding: 10px 14px; margin: 12px 0; border-radius: 4px; }
    .pdf-page-container .page-break { display: none !important; }
  `;

  document.head.appendChild(styleTag);
  document.body.appendChild(stage);

  try {
    // Wait for fonts to be ready
    if (document.fonts) {
      await document.fonts.ready;
    }

    const pdf = new jsPDF(isPortrait ? 'p' : 'l', 'mm', 'a4');
    let hasExportedAnyPage = false;

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      onProgress?.(pageIdx + 1, totalPages);

      // Create page wrapper
      const pageEl = document.createElement('div');
      pageEl.className = 'pdf-page-container';
      pageEl.innerHTML = pageHtmlList[pageIdx];

      // Add shapes on first page or throughout if matching
      if (shapes.length > 0 && (pageIdx === 0 || totalPages === 1)) {
        const shapesOverlay = renderShapesSvg(shapes, widthPx, heightPx);
        pageEl.insertAdjacentHTML('beforeend', shapesOverlay);
      }

      stage.innerHTML = '';
      stage.appendChild(pageEl);

      // Convert any remote images to base64 to avoid tainted canvas
      await inlineImagesAsBase64(pageEl);

      // Give browser brief tick to layout
      await new Promise((r) => setTimeout(r, 60));

      // Capture with html2canvas
      const canvas = await html2canvas(pageEl, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false, // Must be false to allow canvas.toDataURL without security exception
        backgroundColor: '#ffffff',
        width: widthPx,
        height: heightPx,
        logging: false
      });

      const pageImgData = canvas.toDataURL('image/jpeg', 0.95);

      if (hasExportedAnyPage) {
        pdf.addPage('a4', isPortrait ? 'p' : 'l');
      }

      pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfW, pdfH);
      hasExportedAnyPage = true;

      // Clean up canvas memory
      canvas.width = 0;
      canvas.height = 0;
    }

    const cleanFileName = (title || 'document').replace(/[\\/:*?"<>|]/g, '_').trim();
    pdf.save(`${cleanFileName}.pdf`);
    return true;
  } catch (err: any) {
    console.error('PDF export failed, falling back to print dialog:', err);
    // Automatic fallback to high quality iframe print
    printDocument(htmlContent, {
      title,
      orientation,
      margins
    });
    return false;
  } finally {
    // Always cleanup stage and injected styles
    if (stage.parentNode) {
      stage.parentNode.removeChild(stage);
    }
    if (styleTag.parentNode) {
      styleTag.parentNode.removeChild(styleTag);
    }
  }
}
