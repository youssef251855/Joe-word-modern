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
import { printDocument } from './lib/printUtils';
import { exportToWord } from './lib/wordExportUtils';
import { exportDocumentToPdf } from './lib/pdfExportUtils';
import { ShapeItem, ShapeType } from './types/shapes';
import ShapesLayer from './components/ShapesLayer';
import ShapesToolbar from './components/ShapesToolbar';
import { 
  createJoedDocument, 
  serializeJoed, 
  parseJoed, 
  downloadJoedFile, 
  exportToStandaloneHtml, 
  convertToMarkdown 
} from './lib/joedFormat';
import { importDocxFile } from './lib/docxImporter';

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
          console.warn('Failed to load PDF worker as Blob, falling back to direct URL', error);
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
  
  // Shapes State
  const [shapes, setShapes] = useState<ShapeItem[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [shapesHistory, setShapesHistory] = useState<ShapeItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [pageLayout, setPageLayout] = useState<{
    margins: 'normal' | 'narrow' | 'wide';
    orientation: 'portrait' | 'landscape';
  }>({
    margins: 'normal',
    orientation: 'portrait'
  });
  const editorRef = useRef<EditorHandle>(null);
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);

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

  // Shapes Undo/Redo & State updates
  const handleUpdateShapes = (newShapes: ShapeItem[], recordHistory: boolean = true) => {
    if (recordHistory) {
      setShapesHistory(prev => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, shapes];
      });
      setHistoryIndex(prev => prev + 1);
    }
    setShapes(newShapes);
  };

  const handleShapesUndo = () => {
    if (historyIndex >= 0) {
      const prevShapes = shapesHistory[historyIndex];
      setHistoryIndex(prev => prev - 1);
      setShapes(prevShapes);
    }
  };

  const handleInsertShape = (type: ShapeType) => {
    const newShape: ShapeItem = {
      id: 'shape-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      type,
      x: 140 + (shapes.length % 5) * 25,
      y: 120 + (shapes.length % 5) * 25,
      width: type === 'circle' || type === 'star' ? 140 : type === 'line' ? 220 : 180,
      height: type === 'line' ? 4 : type === 'circle' || type === 'star' ? 140 : 120,
      rotation: 0,
      fill: type === 'line' ? 'transparent' : '#3b82f6',
      stroke: type === 'line' ? '#2563eb' : '#1d4ed8',
      strokeWidth: type === 'line' ? 3 : 2,
      strokeStyle: 'solid',
      opacity: 1,
      zIndex: (shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex || 1)) + 1 : 1),
      text: '',
      textStyle: {
        fontSize: 14,
        fontFamily: 'Cairo',
        color: '#ffffff',
        bold: true,
        italic: false,
        underline: false,
        align: 'center'
      }
    };

    handleUpdateShapes([...shapes, newShape]);
    setSelectedShapeIds([newShape.id]);
  };

  const handleDeleteSelectedShapes = () => {
    if (selectedShapeIds.length === 0) return;
    const remaining = shapes.filter(s => !selectedShapeIds.includes(s.id));
    handleUpdateShapes(remaining);
    setSelectedShapeIds([]);
  };

  const handleDuplicateSelectedShapes = () => {
    if (selectedShapeIds.length === 0) return;
    const selected = shapes.filter(s => selectedShapeIds.includes(s.id));
    const duplicates: ShapeItem[] = selected.map(s => ({
      ...s,
      id: 'shape-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      x: s.x + 25,
      y: s.y + 25,
      zIndex: (Math.max(...shapes.map(item => item.zIndex || 1), 1)) + 1
    }));

    handleUpdateShapes([...shapes, ...duplicates]);
    setSelectedShapeIds(duplicates.map(d => d.id));
  };

  const handleGroupSelectedShapes = () => {
    if (selectedShapeIds.length < 2) return;
    const newGroupId = 'group-' + Date.now();
    const updated = shapes.map(s => {
      if (selectedShapeIds.includes(s.id)) {
        return { ...s, groupId: newGroupId };
      }
      return s;
    });
    handleUpdateShapes(updated);
  };

  const handleUngroupSelectedShapes = () => {
    if (selectedShapeIds.length === 0) return;
    const updated = shapes.map(s => {
      if (selectedShapeIds.includes(s.id)) {
        const { groupId, ...rest } = s;
        return rest as ShapeItem;
      }
      return s;
    });
    handleUpdateShapes(updated);
  };

  const handleSelectDocument = async (id: string) => {
    try {
      const docRef = doc(db, 'documents', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setContent(data.content || '');
        setTitle(data.title || 'مستند بدون عنوان');
        setShapes(data.shapes || []);
        if (data.pageLayout) setPageLayout(data.pageLayout);
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
      setShapes([]);
      setSelectedShapeIds([]);
      setCurrentDocId(null);
      setView('editor');
      setShowTemplateModal(false);
      
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
    setShapes([]);
    setSelectedShapeIds([]);
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
    if (!user) {
      // Save local JOED download if not authenticated
      handleSaveJoed();
      return;
    }
    try {
      const currentHtml = editorRef.current?.getHtml() || content;
      if (currentDocId) {
        const docRef = doc(db, 'documents', currentDocId);
        await setDoc(docRef, {
          title,
          content: currentHtml,
          shapes,
          pageLayout,
          updatedAt: serverTimestamp(),
          userId: user.uid
        }, { merge: true });
      } else {
        const docRef = await addDoc(collection(db, 'documents'), {
          title,
          content: currentHtml,
          shapes,
          pageLayout,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userId: user.uid
        });
        setCurrentDocId(docRef.id);
      }
      alert('تم حفظ المستند بنجاح! 💾');
    } catch (error) {
      console.error('Error saving document to firestore:', error);
      alert('فشل حفظ المستند في السحابة.');
    }
  };

  // JOED Native Format Save
  const handleSaveJoed = async () => {
    const currentHtml = editorRef.current?.getHtml() || content;
    const joedDoc = await createJoedDocument({
      title: title || 'مستند Joe Word',
      content: currentHtml,
      shapes,
      pageLayout,
      language: 'ar',
      direction: 'rtl'
    });
    const fileName = `${title || 'مستند-جو-وورد'}.joed`;
    downloadJoedFile(joedDoc, fileName);
  };

  // Open Document (JOED, DOCX, PDF, HTML, TXT, MD)
  const handleOpenDocument = async (file: File) => {
    setIsLoading(true);
    try {
      const fileName = file.name.toLowerCase();
      const cleanDocTitle = file.name.replace(/\.[^/.]+$/, "");

      if (fileName.endsWith('.joed') || file.type === 'application/json') {
        const text = await file.text();
        const parsedResult = parseJoed(text);
        if (parsedResult.success && parsedResult.document) {
          const doc = parsedResult.document;
          setTitle(doc.metadata.title || cleanDocTitle);
          setContent(doc.content);
          setShapes(doc.shapes || []);
          setSelectedShapeIds([]);
          if (doc.pageLayout) {
            setPageLayout(doc.pageLayout);
          }
          setView('editor');
          setTimeout(() => {
            editorRef.current?.setHtml(doc.content);
          }, 100);
          alert(`تم فتح مستند JOED بنجاح: "${doc.metadata.title}" (يحتوي على ${doc.shapes?.length || 0} شكل) 📐🎉`);
        } else {
          alert(`تعذر قراءة ملف JOED: ${parsedResult.error || 'الملف غير صالح'}`);
        }
      } else if (fileName.endsWith('.docx') || file.type.includes('wordprocessingml') || file.type.includes('msword')) {
        const result = await importDocxFile(file);
        setTitle(cleanDocTitle);
        setContent(result.html);
        setShapes([]);
        setSelectedShapeIds([]);
        setView('editor');
        setTimeout(() => {
          editorRef.current?.setHtml(result.html);
        }, 100);
        alert(`تم فتح وقراءة ملف Microsoft Word (.docx) بنجاح! 📄✨`);
      } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
        const text = await file.text();
        setTitle(cleanDocTitle);
        setContent(text);
        setShapes([]);
        setSelectedShapeIds([]);
        setView('editor');
        setTimeout(() => {
          editorRef.current?.setHtml(text);
        }, 100);
        alert("تم استيراد ملف HTML بنجاح! 🌐");
      } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        const text = await file.text();
        const html = text.split('\n').map(l => `<p>${l || '<br>'}</p>`).join('');
        setTitle(cleanDocTitle);
        setContent(html);
        setShapes([]);
        setSelectedShapeIds([]);
        setView('editor');
        setTimeout(() => {
          editorRef.current?.setHtml(html);
        }, 100);
        alert("تم فتح الملف النصي بنجاح! 📝");
      } else if (fileName.endsWith('.pdf')) {
        if ((window as any).pdfjsLib) {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullHtml = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullHtml += `<p>${pageText}</p>`;
            if (i < pdf.numPages) {
              fullHtml += '<hr class="page-break" contenteditable="false">';
            }
          }
          setTitle(cleanDocTitle);
          setContent(fullHtml);
          setShapes([]);
          setSelectedShapeIds([]);
          setView('editor');
          setTimeout(() => {
            editorRef.current?.setHtml(fullHtml);
          }, 100);
          alert("تم استيراد صفحات ملف PDF بنجاح! 📑");
        } else {
          alert("مكتبة قراءة PDF غير جاهزة حالياً.");
        }
      } else {
        const text = await file.text();
        const html = `<p>${text.replace(/\n/g, '<br>')}</p>`;
        setTitle(cleanDocTitle);
        setContent(html);
        setShapes([]);
        setSelectedShapeIds([]);
        setView('editor');
        setTimeout(() => {
          editorRef.current?.setHtml(html);
        }, 100);
      }
    } catch (err: any) {
      console.error("Error opening document:", err);
      alert(`فشل فتح المستند: ${err.message || 'خطأ غير متوقع'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDocxClick = () => {
    hiddenFileInputRef.current?.click();
  };

  const handleOpenJoedClick = () => {
    hiddenFileInputRef.current?.click();
  };

  const handlePrint = () => {
    const currentHtml = editorRef.current?.getHtml() || content;
    printDocument(currentHtml, {
      title,
      orientation: pageLayout.orientation,
      margins: pageLayout.margins
    });
  };

  const handleExportWord = () => {
    const currentHtml = editorRef.current?.getHtml() || content;
    exportToWord(currentHtml, title, {
      orientation: pageLayout.orientation
    });
  };

  const handleExportHtml = () => {
    const currentHtml = editorRef.current?.getHtml() || content;
    const standaloneHtml = exportToStandaloneHtml({
      title: title || 'مستند Joe Word',
      content: currentHtml,
      shapes,
      pageLayout
    });
    const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'document'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const currentHtml = editorRef.current?.getHtml() || content;
    const md = convertToMarkdown(currentHtml, shapes);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'document'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        const currentContent = editorRef.current?.getHtml() || '';
        editorRef.current?.setHtml(currentContent + ' ' + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsDictating(false);
      if (event.error === 'not-allowed') {
        alert("لم يتم السماح بالوصول إلى الميكروفون.");
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

  const handleExportPdf = async () => {
    const currentHtml = editorRef.current?.getHtml() || content;
    if (!currentHtml || !currentHtml.trim() || currentHtml === '<p><br></p>') {
      alert("المستند فارغ! يرجى كتابة أو إدراج محتوى قبل تصدير ملف PDF.");
      return;
    }

    setIsExporting(true);
    setExportProgress({ current: 1, total: Math.max(totalPages, 1) });

    try {
      const success = await exportDocumentToPdf(currentHtml, {
        title: title || 'مستند Joe Word',
        orientation: pageLayout.orientation,
        margins: pageLayout.margins,
        shapes,
        onProgress: (current, total) => {
          setExportProgress({ current, total });
        }
      });

      if (!success) {
        alert("تم فتح نافذة الطباعة كبديل عالي الجودة لحفظ المستند كملف PDF.");
      }
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      handlePrint();
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isDarkMode ? 'dark' : ''} bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100`}>
      {/* Hidden file input for Ribbon/Header file picking */}
      <input 
        type="file" 
        ref={hiddenFileInputRef} 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleOpenDocument(file);
          if (hiddenFileInputRef.current) hiddenFileInputRef.current.value = '';
        }} 
        accept=".joed,.docx,.pdf,.txt,.html,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/json" 
        className="hidden" 
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {view === 'dashboard' ? (
          <DocumentList 
            onSelectDocument={handleSelectDocument}
            onCreateDocument={handleCreateNewDocument}
            onOpenDocument={handleOpenDocument}
          />
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Pinned Top Navigation Bar (Header + Ribbon with File, Home, Insert, Layout) */}
            <div className="sticky top-0 z-50 shrink-0 w-full bg-white dark:bg-slate-900 shadow-xs border-b border-slate-200 dark:border-slate-800 no-print">
              <Header 
                title={title} 
                onTitleChange={setTitle} 
                onNewDocument={() => handleCreateNewDocument()} 
                onOpenDocument={handleOpenDocument} 
                onExportWord={handleExportWord} 
                onExportPdf={handleExportPdf} 
                onSave={handleSaveToFirestore}
                onSaveJoed={handleSaveJoed}
                onPrint={handlePrint}
              />

              {/* Ribbon Controls */}
              {!isReadingMode && (
                <Ribbon 
                  onSave={handleSaveToFirestore}
                  onSaveJoed={handleSaveJoed}
                  onOpenDocx={handleOpenDocxClick}
                  onOpenJoed={handleOpenJoedClick}
                  onPrint={handlePrint}
                  onExportWord={handleExportWord}
                  onExportPdf={handleExportPdf}
                  onExportTxt={handleExportTxt}
                  onExportHtml={handleExportHtml}
                  onExportMarkdown={handleExportMarkdown}
                  onInsertShape={handleInsertShape}
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
                    } else {
                      editorRef.current?.format(name, value);
                    }
                  }}
                  onUndo={() => {
                    if (selectedShapeIds.length > 0) {
                      handleShapesUndo();
                    } else {
                      editorRef.current?.undo();
                    }
                  }}
                  onRedo={() => {
                    editorRef.current?.redo();
                  }}
                />
              )}
            </div>

            {isReadingMode && (
              <div className="absolute top-4 left-4 z-50 no-print">
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
              {/* Navigation Pane */}
              {showNavigation && !isReadingMode && (
                <div className="hidden md:block no-print">
                  <NavigationPane headings={headings} />
                </div>
              )}

              {/* AI Assistant */}
              {isAIAssistantOpen && (
                <div className="absolute inset-y-0 right-0 h-full z-30 md:relative md:z-20 shrink-0 no-print">
                  <AIAssistant 
                    editorRef={editorRef} 
                    isOpen={isAIAssistantOpen} 
                    onClose={() => setIsAIAssistantOpen(false)} 
                    documentContent={content}
                    documentTitle={title}
                    onUpdateTitle={setTitle}
                    onSetContent={setContent}
                    currentShapes={shapes}
                    onAddShapes={(newShapes) => handleUpdateShapes([...shapes, ...newShapes])}
                  />
                </div>
              )}

              {/* Document Page Canvas Area */}
              <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 flex flex-col items-center scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                
                {/* Floating Shapes Styling Toolbar */}
                {selectedShapeIds.length > 0 && !isReadingMode && (
                  <div className="sticky top-2 z-40 mb-3 no-print max-w-2xl w-full">
                    <ShapesToolbar 
                      selectedShapes={shapes.filter(s => selectedShapeIds.includes(s.id))}
                      allShapes={shapes}
                      onUpdateShapes={handleUpdateShapes}
                      onDeleteSelected={handleDeleteSelectedShapes}
                      onDuplicateSelected={handleDuplicateSelectedShapes}
                      onGroupSelected={handleGroupSelectedShapes}
                      onUngroupSelected={handleUngroupSelectedShapes}
                    />
                  </div>
                )}

                <div 
                  className={`bg-white shadow-[0_0_12px_rgba(0,0,0,0.12)] transition-all duration-300 hover:shadow-[0_0_18px_rgba(0,0,0,0.18)] mb-8 relative
                    ${pageLayout.orientation === 'portrait' ? 'w-full max-w-full md:max-w-[816px]' : 'w-full max-w-full md:max-w-[1056px]'}
                    ${pageLayout.margins === 'normal' ? 'p-4 sm:p-8 md:p-[96px]' : pageLayout.margins === 'narrow' ? 'p-2 sm:p-4 md:p-8' : 'p-6 sm:p-12 md:p-[128px]'}
                  `}
                  style={{
                    minHeight: `${Math.max(
                      pageLayout.orientation === 'portrait' ? 850 : 600,
                      Math.floor((pageLayout.orientation === 'portrait' ? 850 : 600) + (wordCount * 1.5))
                    )}px`
                  }}
                >
                  {/* Interactive Shapes Layer with drag, resize, rotate, text insertion */}
                  <ShapesLayer 
                    shapes={shapes}
                    onChange={handleUpdateShapes}
                    onShapesChange={handleUpdateShapes}
                    selectedIds={selectedShapeIds}
                    onSelect={setSelectedShapeIds}
                    onSelectIds={setSelectedShapeIds}
                    containerWidth={pageLayout.orientation === 'portrait' ? 816 : 1056}
                    containerHeight={Math.max(
                      pageLayout.orientation === 'portrait' ? 850 : 600,
                      Math.floor((pageLayout.orientation === 'portrait' ? 850 : 600) + (wordCount * 1.5))
                    )}
                    disabled={isReadingMode}
                  />

                  {/* Document Editor */}
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
                <div className="w-64 bg-white border-l border-slate-200 p-4 h-full no-print">
                  <ImagePropertiesPanel image={selectedImage} onClose={() => setSelectedImage(null)} />
                </div>
              )}
            </div>

            <div className="no-print">
              <StatusBar wordCount={wordCount} activePage={activePage} totalPages={totalPages} />
            </div>
          </div>
        )}
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 no-print">
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-full" dir="rtl">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">إحصائيات متقدمة</h2>
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">الكلمات:</span>
                <span className="font-semibold dark:text-white">{wordCount}</span>
              </div>
              <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">الأشكال الهندسية:</span>
                <span className="font-semibold dark:text-white">{shapes.length} شكل</span>
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

      {/* Exporting PDF Modal / Loader */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center" dir="rtl">
            <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 animate-spin">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">جاري إنشاء وتصدير ملف PDF...</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {exportProgress ? `معالجة الصفحة ${exportProgress.current} من ${exportProgress.total}...` : 'يرجى الانتظار لحظات...'}
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-rose-600 h-full transition-all duration-300"
                style={{ width: `${exportProgress ? (exportProgress.current / exportProgress.total) * 100 : 50}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
