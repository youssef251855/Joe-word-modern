const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const oldHandleExportPdf = `  const handleExportPdf = async () => {
    const element = document.querySelector('.ql-editor') as HTMLElement;
    if (!element) return;

    // Heuristic page estimator to split extremely long text without manual page breaks
    const getEstimatedHeight = (node: Node): number => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim() || '';
        if (!text) return 0;
        return Math.max(20, Math.ceil(text.length / 80) * 24);
      }
      if (node instanceof HTMLElement) {
        if (node.classList.contains('page-break') || node.tagName === 'HR') {
          return -1; // Manual page break
        }
        const tagName = node.tagName.toLowerCase();
        let height = 0;
        if (tagName.startsWith('h')) {
          height += 40;
        } else if (tagName === 'img') {
          height += 300;
        } else if (tagName === 'table') {
          height += 200;
        } else {
          const textLen = node.textContent?.trim().length || 0;
          if (textLen === 0) {
            const images = node.querySelectorAll('img');
            if (images.length > 0) {
              height += images.length * 300;
            } else {
              height += 24;
            }
          } else {
            height += Math.max(24, Math.ceil(textLen / 70) * 24);
            const images = node.querySelectorAll('img');
            if (images.length > 0) {
              height += images.length * 300;
            }
          }
        }
        height += 16;
        return height;
      }
      return 0;
    };

    const isPortrait = pageLayout.orientation === 'portrait';
    const childNodes = Array.from(element.childNodes);
    const pages: Node[][] = [];
    let currentPage: Node[] = [];
    let currentHeightSum = 0;
    const maxPageHeight = isPortrait ? 900 : 600;

    for (const node of childNodes) {
      const estHeight = getEstimatedHeight(node);
      if (estHeight === -1) {
        if (currentPage.length > 0) {
          pages.push(currentPage);
        }
        currentPage = [];
        currentHeightSum = 0;
      } else {
        if (currentPage.length > 0 && currentHeightSum + estHeight > maxPageHeight) {
          pages.push(currentPage);
          currentPage = [node];
          currentHeightSum = estHeight;
        } else {
          currentPage.push(node);
          currentHeightSum += estHeight;
        }
      }
    }
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    const nonSeededPages = pages.filter(p => p.length > 0 || p.some(n => n.textContent?.trim() !== ''));
    const finalPages = nonSeededPages.length > 0 ? nonSeededPages : [[]];

    if (finalPages.length > 15) {
      setPendingPageCount(finalPages.length);
      setPendingPages(finalPages);
      setShowLongDocModal(true);
      return;
    }

    await executeActualPdfExport(finalPages);
  };`;

const newHandleExportPdf = `  const handleExportPdf = async () => {
    const element = document.querySelector('.ql-editor') as HTMLElement;
    if (!element) return;

    const isPortrait = pageLayout.orientation === 'portrait';
    const widthPx = isPortrait ? 794 : 1123;
    const padding = pageLayout.margins === 'normal' ? 160 : pageLayout.margins === 'narrow' ? 64 : 240;
    const maxPageHeight = (isPortrait ? 1123 : 794) - padding;

    // Create a temporary container to accurately measure node heights
    const measureContainer = document.createElement('div');
    measureContainer.className = 'ql-editor printable-area export-pdf-container';
    measureContainer.style.position = 'fixed';
    measureContainer.style.left = '-9999px';
    measureContainer.style.top = '0px';
    measureContainer.style.width = \`\${widthPx}px\`;
    measureContainer.style.padding = \`\${padding / 2}px\`;
    measureContainer.style.fontFamily = "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif";
    measureContainer.style.direction = 'rtl';
    measureContainer.style.textAlign = 'right';
    measureContainer.style.boxSizing = 'border-box';
    document.body.appendChild(measureContainer);

    const childNodes = Array.from(element.childNodes);
    const pages: Node[][] = [];
    let currentPage: Node[] = [];
    let currentHeightSum = 0;

    for (const node of childNodes) {
      if (node instanceof HTMLElement && (node.classList.contains('page-break') || node.tagName === 'HR')) {
        if (currentPage.length > 0) {
          pages.push(currentPage);
        }
        currentPage = [];
        currentHeightSum = 0;
        continue;
      }
      
      const clonedNode = node.cloneNode(true) as HTMLElement;
      measureContainer.appendChild(clonedNode);
      const nodeHeight = clonedNode.getBoundingClientRect ? clonedNode.getBoundingClientRect().height : 24;
      measureContainer.removeChild(clonedNode);

      if (currentPage.length > 0 && currentHeightSum + nodeHeight > maxPageHeight) {
        pages.push(currentPage);
        currentPage = [node];
        currentHeightSum = nodeHeight;
      } else {
        currentPage.push(node);
        currentHeightSum += nodeHeight;
      }
    }
    
    document.body.removeChild(measureContainer);

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    const nonSeededPages = pages.filter(p => p.length > 0 || p.some(n => n.textContent?.trim() !== ''));
    const finalPages = nonSeededPages.length > 0 ? nonSeededPages : [[]];

    if (finalPages.length > 15) {
      setPendingPageCount(finalPages.length);
      setPendingPages(finalPages);
      setShowLongDocModal(true);
      return;
    }

    await executeActualPdfExport(finalPages);
  };`;

if (code.includes(oldHandleExportPdf)) {
  code = code.replace(oldHandleExportPdf, newHandleExportPdf);
  fs.writeFileSync('App.tsx', code);
  console.log('Replaced handleExportPdf successfully');
} else {
  console.log('Failed to find handleExportPdf block');
}
