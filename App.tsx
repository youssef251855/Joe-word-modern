import React, { useState, useEffect, useRef } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Header from './components/Header';
import Ribbon from './components/Ribbon';
import NavigationPane from './components/NavigationPane';
import StatusBar from './components/StatusBar';
import Editor, { EditorHandle } from './components/Editor';
import ImagePropertiesPanel from './components/ImagePropertiesPanel';
import Auth from './components/Auth';
import DocumentList from './components/DocumentList';
import AIAssistant from './components/AIAssistant';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { supabase } from './supabase';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Heading {
  text: string;
  level: number;
  id: string;
}

const App: React.FC = () => {
  useEffect(() => {
    // Set up PDF.js worker using the cdnjs for version 3.11.174
    if (typeof window !== 'undefined' && (window as any).pdfjsLib && !(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc) {
      const workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      fetch(workerSrc)
        .then(response => response.text())
        .then(code => {
          const blob = new Blob([code], { type: 'text/javascript' });
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
        })
        .catch(error => {
          console.warn('Failed to load PDF worker as Blob, falling back to direct URL (might cause CORS issues)', error);
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
        });
    }
  }, []);

  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'editor' | 'dashboard'>('dashboard');
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('مستند بدون عنوان');
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [showNavigation, setShowNavigation] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);
  const [isReadingMode, setIsReadingMode] = useState<boolean>(false);
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showLongDocModal, setShowLongDocModal] = useState<boolean>(false);
  const [pendingPageCount, setPendingPageCount] = useState<number>(0);
  const [pendingPages, setPendingPages] = useState<Node[][] | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activePage, setActivePage] = useState<number>(1);
  const recognitionRef = useRef<any>(null);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [pageLayout, setPageLayout] = useState<{
    margins: 'normal' | 'narrow' | 'wide';
    orientation: 'portrait' | 'landscape';
  }>({
    margins: 'normal',
    orientation: 'portrait'
  });
  const editorRef = useRef<EditorHandle>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Extract headings from content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const extractedHeadings: Heading[] = Array.from(headingElements).map((el, index) => ({
      text: el.textContent || '',
      level: parseInt(el.tagName.substring(1)),
      id: `heading-${index}`
    }));
    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    if (!content) {
      setTotalPages(1);
      return;
    }
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const childNodes = Array.from(doc.body.childNodes);
      
      let pageCount = 0;
      let currentHeightSum = 0;
      const isPortrait = pageLayout.orientation === 'portrait';
      const maxPageHeight = isPortrait ? 900 : 600;

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

      let hasContent = false;
      for (const node of childNodes) {
        const estHeight = getEstimatedHeight(node);
        if (estHeight === -1) {
          pageCount++;
          currentHeightSum = 0;
          hasContent = false;
        } else {
          hasContent = true;
          if (currentHeightSum > 0 && currentHeightSum + estHeight > maxPageHeight) {
            pageCount++;
            currentHeightSum = estHeight;
          } else {
            currentHeightSum += estHeight;
          }
        }
      }
      if (hasContent || pageCount === 0) {
        pageCount++;
      }
      
      setTotalPages(pageCount);
    } catch (err) {
      console.error("Error updating total pages:", err);
    }
  }, [content, pageLayout]);

  useEffect(() => {
    const handleActivePageChange = (e: any) => {
      if (e.detail && typeof e.detail.activePage === 'number') {
        setActivePage(e.detail.activePage);
      }
    };
    window.addEventListener('editor-active-page-change', handleActivePageChange);
    return () => {
      window.removeEventListener('editor-active-page-change', handleActivePageChange);
    };
  }, []);

  const handleSelectDocument = async (id: string) => {
    try {
      const docRef = doc(db, 'documents', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setContent(data.content || '');
        setTitle(data.title || 'مستند بدون عنوان');
        setCurrentDocId(id);
        setView('editor');
      }
    } catch (error) {
      console.error('Error loading document:', error);
    }
  };

  const handleCreateNewDocument = (templateContent?: string) => {
    if (typeof templateContent === 'string') {
      setContent(templateContent);
      setTitle('مستند جديد');
      setCurrentDocId(null);
      setView('editor');
      setShowTemplateModal(false);
      
      // Delay to ensure Editor is mounted before setting content
      setTimeout(() => {
        editorRef.current?.setHtml(templateContent);
      }, 100);
    } else {
      setShowTemplateModal(true);
    }
  };

  const handleCreateBlankDocument = () => {
    setContent('');
    setTitle('مستند بدون عنوان');
    setCurrentDocId(null);
    setView('editor');
    setShowTemplateModal(false);
    editorRef.current?.clear();
  };

  const templates = [
    { id: 'blank', name: 'فارغ', icon: '📄' },
    { id: 'report', name: 'تقرير', icon: '📋', content: '<h1 class="ql-align-center">تقرير رسمي</h1><p><br></p><h2>مقدمة</h2><p>اكتب مقدمة التقرير هنا...</p><h2>الموضوع</h2><p>اكتب التفاصيل هنا...</p>' },
    { id: 'letter', name: 'رسالة', icon: '✉️', content: '<p>التاريخ: </p><p>إلى: </p><p><br></p><p>الموضوع: </p><p><br></p><p>تحية طيبة وبعد،</p><p><br></p>' },
    { id: 'notes', name: 'ملاحظات', icon: '🗒️', content: '<h2>ملاحظات الاجتماع</h2><ul><li>النقطة الأولى</li><li>النقطة الثانية</li></ul>' },
  ];

  const handleSaveToFirestore = async () => {
    if (!user) return;
    try {
      if (currentDocId) {
        const docRef = doc(db, 'documents', currentDocId);
        await setDoc(docRef, {
          title,
          content,
          updatedAt: serverTimestamp(),
          userId: user.uid
        }, { merge: true });
      } else {
        const docRef = await addDoc(collection(db, 'documents'), {
          title,
          content,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userId: user.uid
        });
        setCurrentDocId(docRef.id);
      }
      alert('تم الحفظ بنجاح');
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleOpenDocument = async (file: File) => {
    console.log('File uploaded:', file.name, file.type);
    setView('editor');
    setIsLoading(true);
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      console.log('PDF detected, starting parsing...');
      const reader = new FileReader();
      reader.onload = async (e) => {
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
        try {
          console.log('PDF data loaded, size:', typedarray.length);
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) throw new Error('PDF.js library not loaded');
          const loadingTask = pdfjsLib.getDocument({ data: typedarray });
          const pdf = await loadingTask.promise;
          console.log('PDF loaded, pages:', pdf.numPages);
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `<p>${pageText}</p>`;

            // Extract images
            const operatorList = await page.getOperatorList();
            const imageNames = operatorList.argsArray.filter((_: any, index: number) => operatorList.fnArray[index] === pdfjsLib.OPS.paintImageXObject).map((args: any) => args[0]);
            
            for (const name of imageNames) {
              try {
                let image = null;
                // Retry mechanism to handle "Requesting object that isn't resolved yet"
                for (let retry = 0; retry < 5; retry++) {
                  try {
                    image = await page.objs.get(name);
                    if (image) break;
                  } catch (e) {
                    console.log(`Retry ${retry + 1} for image ${name}`);
                    await new Promise(resolve => setTimeout(resolve, 200));
                  }
                }

                if (image) {
                  console.log('Image object:', image);
                  // Try to find a way to get the image data
                  if (typeof image.getDataURL === 'function') {
                    const dataUrl = await image.getDataURL();
                    fullText += `<img src="${dataUrl}" style="max-width: 100%;" />`;
                  } else if (image.data) {
                    // Fallback: This is a simplified approach and might not work for all image types
                    console.log('Image has data property, attempting to create canvas');
                    const canvas = document.createElement('canvas');
                    canvas.width = image.width;
                    canvas.height = image.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      const imageData = new ImageData(new Uint8ClampedArray(image.data), image.width, image.height);
                      ctx.putImageData(imageData, 0, 0);
                      const dataUrl = canvas.toDataURL();
                      fullText += `<img src="${dataUrl}" style="max-width: 100%;" />`;
                    }
                  } else if (image.bitmap instanceof ImageBitmap) {
                    console.log('Image has bitmap property, attempting to create canvas from bitmap');
                    const canvas = document.createElement('canvas');
                    canvas.width = image.width;
                    canvas.height = image.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(image.bitmap, 0, 0);
                      const dataUrl = canvas.toDataURL();
                      fullText += `<img src="${dataUrl}" style="max-width: 100%;" />`;
                    }
                  } else {
                    console.log('Cannot extract image, no getDataURL, data, or bitmap property. Image object:', image);
                  }
                }
              } catch (e) {
                console.error('Error extracting image:', e);
              }
            }

            if (i < pdf.numPages) {
              fullText += '<hr class="page-break" contenteditable="false">';
            }
          }
          console.log('PDF parsing finished, text length:', fullText.length);
          setContent(fullText);
          setTitle(file.name.replace('.pdf', ''));
        } catch (error) {
          console.error('Error parsing PDF:', error);
          alert('حدث خطأ أثناء فتح ملف PDF: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      console.log('Text file detected');
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
        setTitle(file.name.replace('.txt', ''));
        setIsLoading(false);
      };
      reader.readAsText(file);
    } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
      console.log('HTML file detected');
      const reader = new FileReader();
      reader.onload = (e) => {
        const html = e.target?.result as string;
        setContent(html);
        setTitle(file.name.replace('.html', ''));
        setIsLoading(false);
      };
      reader.readAsText(file);
    } else {
      console.log('Unsupported file type:', file.type);
      alert('عذراً، هذا النوع من الملفات غير مدعوم حالياً. يرجى اختيار ملف PDF أو نصي.');
      setIsLoading(false);
    }
  };

  const [exportLink, setExportLink] = useState<string | null>(null);

  const handleExportTxt = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const text = doc.body.textContent || '';
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'document'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("متصفحك لا يدعم الإملاء الصوتي. يرجى استخدام متصفح Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        // Append text to editor
        const currentContent = editorRef.current?.getHtml() || '';
        editorRef.current?.setHtml(currentContent + ' ' + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsDictating(false);
      if (event.error === 'not-allowed') {
        alert("لم يتم السماح بالوصول إلى الميكروفون. يرجى تفعيل إذن الميكروفون من إعدادات المتصفح أو فتح التطبيق في علامة تبويب جديدة.");
      } else {
        alert("حدث خطأ في التعرف على الصوت: " + event.error);
      }
    };

    recognition.onend = () => {
      setIsDictating(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsDictating(true);
  };

  const executeActualPdfExport = async (finalPages: Node[][]) => {
    setIsExporting(true);
    setExportProgress({ current: 0, total: finalPages.length });
    setExportLink(null);

    try {
      // Ensure all web fonts are fully loaded prior to rendering
      if (document.fonts) {
        await document.fonts.ready;
      }

      const isPortrait = pageLayout.orientation === 'portrait';
      const pdfWidthMm = isPortrait ? 210 : 297;
      const pdfHeightMm = isPortrait ? 297 : 210;

      // Create a temporary container visible in viewport but fully hidden behind main elements (z-index -9999).
      // WebKit and Safari demand the element be fully inside the viewport bounds for getBoundingClientRect()
      // to yield correct dimensions and coordinates, preventing blank pages.
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '0px';
      tempContainer.style.top = '0px';
      tempContainer.style.zIndex = '-9999';
      tempContainer.style.opacity = '1';
      tempContainer.style.backgroundColor = '#ffffff';
      
      const widthPx = isPortrait ? 794 : 1123;
      const heightPx = isPortrait ? 1123 : 794;
      
      tempContainer.style.width = `${widthPx}px`;
      tempContainer.style.minHeight = `${heightPx}px`;
      tempContainer.style.height = `${heightPx}px`;
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.style.overflow = 'hidden';

      // Apply current layout padding/margins
      if (pageLayout.margins === 'normal') {
        tempContainer.style.padding = '80px';
      } else if (pageLayout.margins === 'narrow') {
        tempContainer.style.padding = '32px';
      } else {
        tempContainer.style.padding = '120px';
      }

      tempContainer.style.fontFamily = "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif";
      tempContainer.style.direction = 'rtl';
      tempContainer.style.textAlign = 'right';
      tempContainer.className = 'ql-editor printable-area export-pdf-container';

      // Ensure appropriate typography, black text color on white background, normal letter spacing, and proper ligatures
      const styleTag = document.createElement('style');
      styleTag.id = 'pdf-export-styles';
      styleTag.innerHTML = `
        .export-pdf-container {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        .export-pdf-container, .export-pdf-container * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif !important;
          letter-spacing: normal !important;
          word-spacing: normal !important;
          font-variant-ligatures: common-ligatures !important;
          text-rendering: optimizeLegibility !important;
          -webkit-font-smoothing: antialiased !important;
          direction: rtl !important;
          text-align: right !important;
        }
        .export-pdf-container img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
        }
        .export-pdf-container .page-break {
          display: none !important;
        }
      `;
      document.head.appendChild(styleTag);
      document.body.appendChild(tempContainer);

      const pdf = new jsPDF(isPortrait ? 'p' : 'l', 'mm', 'a4');
      setExportProgress({ current: 1, total: finalPages.length });

      // Dynamically select pixel ratio and delay based on document size to prevent mobile canvas crashes
      const pageCount = finalPages.length;
      let pixelRatio = 1.5;
      let delayMs = 100;
      
      if (pageCount > 100) {
        pixelRatio = 0.6; // Low memory footprint for massive documents
        delayMs = 40;
      } else if (pageCount > 50) {
        pixelRatio = 0.8;
        delayMs = 60;
      } else if (pageCount > 20) {
        pixelRatio = 1.0;
        delayMs = 100;
      } else if (pageCount > 10) {
        pixelRatio = 1.2;
        delayMs = 100;
      }

      for (let i = 0; i < finalPages.length; i++) {
        tempContainer.innerHTML = '';
        
        // Append cloned nodes
        finalPages[i].forEach(node => {
          tempContainer.appendChild(node.cloneNode(true));
        });

        // Update progress state
        setExportProgress({ current: i + 1, total: finalPages.length });

        // Let images or render cycles settle
        await new Promise(r => setTimeout(r, delayMs));

        // Use html2canvas to render the page to a canvas.
        const canvas = await html2canvas(tempContainer, {
          scale: pixelRatio,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: widthPx,
          height: heightPx,
          allowTaint: true
        });

        const pageDataUrl = canvas.toDataURL('image/jpeg', 0.95);

        // Force free canvas memory immediately to protect iOS/Safari against graphics leaks
        canvas.width = 0;
        canvas.height = 0;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(pageDataUrl, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm);
      }

      // Cleanup temp container and temporary styles
      if (tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      if (styleTag.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }

      const pdfBlob = pdf.output('blob');
      const safeTitle = (title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${safeTitle}.pdf`;

      try {
        pdf.save(fileName);
        const localUrl = URL.createObjectURL(pdfBlob);
        setExportLink(localUrl);
        setIsExporting(false);
        setExportProgress(null);
        return;
      } catch (localError) {
        console.warn("Local export failed, trying upload...", localError);
        if (!supabase) {
          alert('فشل التنزيل المحلي. يرجى إضافة مفاتيح Supabase للرفع التلقائي.');
          setIsExporting(false);
          setExportProgress(null);
          return;
        }

        const uploadFileName = `${Date.now()}_${safeTitle}.pdf`;
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(uploadFileName, pdfBlob, {
            contentType: 'application/pdf',
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          if (error.message.includes('Bucket not found')) {
            throw new Error('لم يتم العثور على مساحة تخزين (Bucket) باسم "documents".');
          }
          throw error;
        }

        const { data: publicUrlData } = supabase.storage
          .from('documents')
          .getPublicUrl(uploadFileName);

        if (publicUrlData && publicUrlData.publicUrl) {
          setExportLink(publicUrlData.publicUrl);
        } else {
          throw new Error('Failed to get public URL');
        }
      }

    } catch (err: any) {
      console.error("Error generating PDF:", err);
      alert(err.message || 'حدث خطأ أثناء تصدير PDF.');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleExportPdf = async () => {
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
  };

  const handleSave = () => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!user) return <Auth />;

  return (
    <div className={`fixed inset-0 flex flex-col overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-2xl font-bold text-primary-600">جاري تحميل الملف...</div>
        </div>
      )}
      {isExporting && (
        <div className="fixed inset-0 bg-white/95 flex flex-col items-center justify-center z-50 gap-4">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-2xl font-bold text-primary-600">جاري تصدير ورفع الملف (PDF)...</div>
          {exportProgress && exportProgress.total > 0 && (
            <div className="text-lg font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm">
              جاري معالجة الصفحة {exportProgress.current} من {exportProgress.total}
            </div>
          )}
        </div>
      )}
      {exportLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full text-center shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">تم تصدير الملف بنجاح!</h3>
            <p className="text-slate-600 mb-6">لقد تم رفع ملف الـ PDF. يمكنك تحميله من خلال الرابط التالي:</p>
            <div className="bg-slate-100 p-3 rounded text-left overflow-x-auto text-sm text-slate-800 mb-6">
              <a href={exportLink} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                {exportLink}
              </a>
            </div>
            <div className="flex gap-4 justify-center">
              <a 
                href={exportLink} 
                target="_blank" 
                rel="noreferrer"
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded font-medium transition-colors"
                onClick={() => setExportLink(null)}
              >
                فتح / تحميل
              </a>
              <button 
                onClick={() => setExportLink(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2 rounded font-medium transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col flex-1 bg-slate-100 dark:bg-slate-900 overflow-hidden">
        {view === 'dashboard' ? (
          <div className="flex-1 overflow-y-auto">
            <Header 
              title="لوحة التحكم" 
              onTitleChange={() => {}} 
              onNewDocument={handleCreateNewDocument}
              onOpenDocument={handleOpenDocument}
              onExportPdf={() => {}}
              onSave={() => {}}
              onPrint={() => {}}
            />
            <DocumentList 
              onSelect={handleSelectDocument} 
              onNewDocument={handleCreateNewDocument} 
              onOpenDocument={handleOpenDocument}
            />
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden relative">
            {!isReadingMode && (
              <div className="shrink-0 z-10 w-full bg-white overflow-hidden shadow-sm">
                {/* Top Bar */}
                <Header 
                  title={title} 
                  onTitleChange={setTitle} 
                  onNewDocument={handleCreateNewDocument}
                  onOpenDocument={handleOpenDocument}
                  onExportPdf={handleExportPdf}
                  onSave={handleSaveToFirestore}
                  onPrint={handlePrint}
                />
                
                {/* Ribbon */}
                <Ribbon 
                  onSave={handleSaveToFirestore}
                  onPrint={handlePrint}
                  onExportPdf={handleExportPdf}
                  onExportTxt={handleExportTxt}
                  onDictate={toggleDictation}
                  isDictating={isDictating}
                  onNewDocument={handleCreateNewDocument}
                  wordCount={wordCount}
                  onShowStats={() => setShowStatsModal(true)}
                  onToggleAIAssistant={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
                  onFormat={(name, value) => {
                    if (name === 'toggleNavigation') {
                      setShowNavigation(!showNavigation);
                    } else if (name === 'margins') {
                      setPageLayout(prev => ({ ...prev, margins: value }));
                    } else if (name === 'orientation') {
                      setPageLayout(prev => ({ ...prev, orientation: value }));
                    } else if (name === 'dashboard') {
                      setView('dashboard');
                    } else if (name === 'pageBreak') {
                      editorRef.current?.insertPageBreak();
                    } else if (name === 'toggleReadingView') {
                      setIsReadingMode(!isReadingMode);
                    } else if (name === 'toggleRuler') {
                      console.log('Toggle ruler');
                      // Add logic here
                    } else if (name === 'toggleGrid') {
                      console.log('Toggle grid');
                      // Add logic here
                    } else {
                      editorRef.current?.format(name, value);
                    }
                  }}
                  onUndo={() => {
                    editorRef.current?.undo();
                  }}
                  onRedo={() => {
                    editorRef.current?.redo();
                  }}
                />
              </div>
            )}

            {isReadingMode && (
              <div className="absolute top-4 left-4 z-50">
                <button 
                  onClick={() => setIsReadingMode(false)}
                  className="bg-slate-800/80 hover:bg-slate-900 text-white rounded-full px-4 py-2 shadow-lg backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 flex flex-row items-center gap-2"
                >
                  <span className="font-medium text-sm">الخروج من وضع القراءة</span>
                </button>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden bg-[#f3f2f1] relative">
              {/* Navigation Pane (Optional) */}
              {showNavigation && !isReadingMode && (
                <div className="hidden md:block">
                  <NavigationPane headings={headings} />
                </div>
              )}

              {/* AI Assistant */}
              {isAIAssistantOpen && (
                <div className="absolute inset-y-0 right-0 h-full z-30 md:relative md:z-20 shrink-0">
                  <AIAssistant 
                    editorRef={editorRef} 
                    isOpen={isAIAssistantOpen} 
                    onClose={() => setIsAIAssistantOpen(false)} 
                    documentContent={content}
                    documentTitle={title}
                    onUpdateTitle={setTitle}
                    onSetContent={setContent}
                  />
                </div>
              )}

              {/* Document Area */}
              <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 flex justify-center scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                <div 
                  className={`bg-white overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,0,0,0.15)] mb-8
                    ${pageLayout.orientation === 'portrait' ? 'w-full max-w-full md:max-w-[816px]' : 'w-full max-w-full md:max-w-[1056px]'}
                    ${pageLayout.margins === 'normal' ? 'p-4 sm:p-8 md:p-[96px]' : pageLayout.margins === 'narrow' ? 'p-2 sm:p-4 md:p-8' : 'p-6 sm:p-12 md:p-[128px]'}
                  `}
                  style={{
                    minHeight: `${Math.max(
                      pageLayout.orientation === 'portrait' ? 450 : 350,
                      Math.floor((pageLayout.orientation === 'portrait' ? 450 : 350) + (wordCount * 1.5))
                    )}px`
                  }}
                >
                  <Editor 
                    ref={editorRef} 
                    value={content} 
                    onChange={setContent} 
                    onWordCount={setWordCount} 
                    onImageSelect={setSelectedImage}
                  />
                </div>
              </main>
              {selectedImage && (
                <div className="w-64 bg-white border-l border-slate-200 p-4 h-full">
                  <ImagePropertiesPanel image={selectedImage} onClose={() => setSelectedImage(null)} />
                </div>
              )}
            </div>
            <StatusBar wordCount={wordCount} activePage={activePage} totalPages={totalPages} />
          </div>
        )}
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full" dir="rtl">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">اختيار قالب المستند</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => tpl.id === 'blank' ? handleCreateBlankDocument() : handleCreateNewDocument(tpl.content)}
                  className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 dark:border-slate-700 hover:border-primary-500 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 group"
                >
                  <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{tpl.icon}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{tpl.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-full" dir="rtl">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">إحصائيات متقدمة</h2>
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">الكلمات:</span>
                <span className="font-semibold dark:text-white">{wordCount}</span>
              </div>
              <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">الأحرف (مع مسافات):</span>
                <span className="font-semibold dark:text-white">{content.replace(/<[^>]*>?/gm, '').length}</span>
              </div>
              <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">الفقرات:</span>
                <span className="font-semibold dark:text-white">{content.split(/<p>|<h1>|<h2>|<h3>/).length - 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">وقت القراءة المقدر:</span>
                <span className="font-semibold dark:text-white">{Math.ceil(wordCount / 200) || 1} دقيقة</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowStatsModal(false)}
                className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Long Document Export Modal */}
      {showLongDocModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-lg w-full" dir="rtl">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              ⚠️ تنبيه: مستند طويل جداً ({pendingPageCount} صفحة)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              لقد تم رصد أن المستند يحتوي على <strong>{pendingPageCount} صفحة</strong>. 
              عند تصدير المستندات الطويلة جداً تلقائياً على المتصفح أو الهاتف، قد تنفد الذاكرة المخصصة للرسومات (Canvas Memory) وتظهر بعض الصفحات فارغة تماماً.
              <br /><br />
              <strong>الخيار الموصى به والأفضل بنسبة 100%:</strong>
              <br />
              انقر على <strong>"طباعة وحفظ كـ PDF"</strong> ثم اختر <strong>"حفظ بتنسيق PDF"</strong> من نافذة الطباعة التابعة لنظام هاتفك أو متصفحك. هذا يضمن الحصول على ملف ذي جودة متناهية وبنصوص حقيقية قابلة للنسخ والبحث بدون أي استهلاك لذاكرة الجهاز.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button 
                onClick={() => {
                  setShowLongDocModal(false);
                  handlePrint();
                }}
                className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2.5 rounded-lg font-medium transition-colors flex-1"
              >
                🖨️ طباعة وحفظ كـ PDF (موصى به للغاية)
              </button>
              <button 
                onClick={() => {
                  setShowLongDocModal(false);
                  if (pendingPages) {
                    executeActualPdfExport(pendingPages);
                  }
                }}
                className="bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                تصدير تلقائي على أي حال
              </button>
              <button 
                onClick={() => setShowLongDocModal(false)}
                className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
