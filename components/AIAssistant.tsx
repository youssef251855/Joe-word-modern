import React, { useState, useRef, useEffect } from 'react';
import { 
  BotIcon, SparklesIcon, XIcon, CheckIcon, RefreshCwIcon, ChevronDownIcon, 
  LayersIcon, BookOpenIcon, LanguagesIcon, ImageIcon, SearchIcon, 
  Edit3Icon, FileTextIcon, ExternalLinkIcon, SendIcon, PlusIcon, CornerDownLeftIcon,
  PaperclipIcon, UploadIcon, PaletteIcon, CheckCircle2
} from 'lucide-react';
import { EditorHandle } from './Editor';
import { cn } from '../lib/utils';
import { generateSmartFallback } from '../lib/smartFallbackGenerator';
import { ShapeItem } from '../types/shapes';
import { 
  generateFrontCoverHtml, 
  generateBackCoverHtml, 
  generateCoverShapes, 
  CoverPlacement, 
  ShapeStyleTheme 
} from '../lib/coverGenerator';

interface AIAssistantProps {
  editorRef: React.RefObject<EditorHandle>;
  isOpen: boolean;
  onClose: () => void;
  documentContent: string;
  documentTitle: string;
  onUpdateTitle: (title: string) => void;
  onSetContent: (html: string) => void;
  currentShapes?: ShapeItem[];
  onAddShapes?: (newShapes: ShapeItem[]) => void;
}

interface ChatSource {
  title: string;
  url: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  imageUrl?: string;
  isCover?: boolean;
  timestamp: Date;
}

interface AttachedImage {
  dataUrl: string;
  name: string;
  size?: number;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  editorRef, isOpen, onClose, documentContent, documentTitle, onUpdateTitle, onSetContent,
  currentShapes = [], onAddShapes
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'selection' | 'book' | 'cover'>('chat');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enableWebSearch, setEnableWebSearch] = useState(true);
  
  // Image attachment states
  const [chatAttachedImage, setChatAttachedImage] = useState<AttachedImage | null>(null);
  const [coverAttachedImage, setCoverAttachedImage] = useState<AttachedImage | null>(null);
  const [bookCoverAttachedImage, setBookCoverAttachedImage] = useState<AttachedImage | null>(null);

  // Hidden file input refs
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const bookFileInputRef = useRef<HTMLInputElement>(null);

  // Cover Customization State
  const [coverPlacement, setCoverPlacement] = useState<CoverPlacement>('first_page');
  const [useShapesForCover, setUseShapesForCover] = useState<boolean>(true);
  const [coverShapeTheme, setCoverShapeTheme] = useState<ShapeStyleTheme>('royal_gold');
  const [coverCustomTitle, setCoverCustomTitle] = useState<string>('');
  const [coverSubtitle, setCoverSubtitle] = useState<string>('');
  const [coverAuthor, setCoverAuthor] = useState<string>('');
  const [coverSynopsis, setCoverSynopsis] = useState<string>('');
  const [coverPrompt, setCoverPrompt] = useState<string>('');
  const [coverStyle, setCoverStyle] = useState<string>('واقعي ومفصل جدًا 4k');
  
  // Chat History
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: 'مرحباً بك! أنا مساعدك الذكي لتأليف الكتب وتصميم الأغلفة والمستندات. يمكنك إرفاق أي صورة لأضعها لك كغلاف فني في أول صفحة أو آخر صفحة مع تزيينها بأشكال هندسية وأوسمة مميزة!',
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  // Book Generation state
  const [bookType, setBookType] = useState('كتاب تعليمي');
  const [bookName, setBookName] = useState('');
  const [bookElements, setBookElements] = useState('');
  const [bookLevel, setBookLevel] = useState('جامعي');
  const [bookSubject, setBookSubject] = useState('عام');
  const [bookStyle, setBookStyle] = useState('شرح مفصل مع أمثلة');
  const [bookNotes, setBookNotes] = useState('');
  const [bookPages, setBookPages] = useState('3');
  const [generateBookCover, setGenerateBookCover] = useState(true);
  const [bookCoverPlacement, setBookCoverPlacement] = useState<CoverPlacement>('first_page');
  const [bookUseShapes, setBookUseShapes] = useState<boolean>(true);

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Synchronize cover title with document title
  useEffect(() => {
    if (documentTitle && !coverCustomTitle) {
      setCoverCustomTitle(documentTitle);
    }
  }, [documentTitle]);

  const handleImageFilePick = (e: React.ChangeEvent<HTMLInputElement>, target: 'chat' | 'cover' | 'book') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, GIF).");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 12 ميجابايت.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const imgObj: AttachedImage = {
        dataUrl,
        name: file.name,
        size: file.size
      };

      if (target === 'chat') {
        setChatAttachedImage(imgObj);
      } else if (target === 'cover') {
        setCoverAttachedImage(imgObj);
      } else if (target === 'book') {
        setBookCoverAttachedImage(imgObj);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addMessage = (role: 'user' | 'assistant', content: string, sources?: ChatSource[], imageUrl?: string, isCover?: boolean) => {
    const newMessage: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      role,
      content,
      sources,
      imageUrl,
      isCover,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  /**
   * Applies Cover HTML & Shapes to document
   */
  const handleApplyCoverToDocument = (options: {
    placement: CoverPlacement;
    imageUrl?: string;
    title?: string;
    subtitle?: string;
    author?: string;
    synopsis?: string;
    useShapes?: boolean;
    theme?: ShapeStyleTheme;
  }) => {
    const title = options.title?.trim() || coverCustomTitle.trim() || documentTitle.trim() || 'عنوان الكتاب';
    const theme = options.theme || coverShapeTheme;
    const useShapes = options.useShapes ?? useShapesForCover;
    const placement = options.placement || coverPlacement;
    const imageUrl = options.imageUrl || coverAttachedImage?.dataUrl;

    const frontHtml = generateFrontCoverHtml({
      title,
      subtitle: options.subtitle || coverSubtitle,
      author: options.author || coverAuthor,
      imageUrl,
      theme
    });

    const backHtml = generateBackCoverHtml({
      title,
      synopsis: options.synopsis || coverSynopsis,
      author: options.author || coverAuthor,
      theme
    });

    const currentHtml = editorRef.current?.getHtml() || documentContent || '';
    const pageBreak = '<hr class="page-break" contenteditable="false">';

    let newHtml = currentHtml;

    if (placement === 'first_page') {
      newHtml = `${frontHtml}${pageBreak}${currentHtml}`;
    } else if (placement === 'last_page') {
      newHtml = `${currentHtml}${pageBreak}${backHtml}`;
    } else if (placement === 'both_pages') {
      newHtml = `${frontHtml}${pageBreak}${currentHtml}${pageBreak}${backHtml}`;
    }

    // Set document content
    editorRef.current?.setHtml(newHtml);
    onSetContent(newHtml);

    // Apply interactive Canvas Shapes if enabled
    if (useShapes && onAddShapes) {
      const generatedShapes = generateCoverShapes({
        title,
        placement,
        theme,
        canvasWidth: 816,
        existingShapesCount: currentShapes.length
      });
      onAddShapes(generatedShapes);
    }

    const placementLabel = placement === 'both_pages' 
      ? 'الغلافين (الأمامي في أول صفحة والخلفي في آخر صفحة)' 
      : placement === 'first_page' 
      ? 'الغلاف في الصفحة الأولى' 
      : 'الغلاف في الصفحة الأخيرة';

    alert(`تم وضع ${placementLabel} وتزيينه بالأشكال بنجاح! 🎨✨`);
  };

  const applyContentToDocument = (htmlContent: string, mode: 'insert' | 'replace' | 'document' = 'insert') => {
    if (mode === 'document') {
      editorRef.current?.setHtml(htmlContent);
      onSetContent(htmlContent);
    } else if (mode === 'replace') {
      editorRef.current?.replaceSelectionHtml(htmlContent);
    } else {
      editorRef.current?.insertHtmlAtCursor(htmlContent);
    }
    alert("تم تطبيق المحتوى في المستند بنجاح! 📌");
  };

  const handleModifyContent = (contentToModify: string) => {
    setPrompt(`يرجى تعديل وتحسين المحتوى كالتالي: `);
    setActiveTab('chat');
    setTimeout(() => {
      promptInputRef.current?.focus();
    }, 100);
  };

  const handleSendMessage = async (userPromptText: string, customSystemInstruction?: string, isBookGen: boolean = false) => {
    if ((!userPromptText.trim() && !chatAttachedImage) || isLoading) return;

    const currentImage = chatAttachedImage?.dataUrl;
    setChatAttachedImage(null);

    // Add user message to chat
    addMessage('user', userPromptText || 'مرفق صورة مع الاستفسار', undefined, currentImage);
    setPrompt('');
    setIsLoading(true);

    try {
      const systemInstruction = customSystemInstruction || 
        "أنت مساعد ذكي متقدم وكاتب ومصمم محترف لتأليف المستندات وتصميم الأغلفة والكتب باللغة العربية. إذا أرفق المستخدم صورة، قم بتحليلها ودمجها بذكاء في الإجابة أو الغلاف. قم بإرجاع الاستجابة بتنسيق HTML نظيف ومصمم بأناقة دون استخدام كتل كود (```html). إذا طُلب تقسيم صفحات أو غلاف، استخدم الفاصل <hr class=\"page-break\" contenteditable=\"false\"> كفاصل بين الصفحات.";

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userPromptText || "حلل هذه الصورة المرفقة واقترح غلافاً أو محتوى مناسباً لها.",
          systemInstruction,
          enableSearch: enableWebSearch,
          model: "gemini-3.8-flash",
          image: currentImage
        })
      });

      let data: any;
      try {
        data = await response.json();
      } catch {
        const text = await response.text();
        throw new Error(text.substring(0, 300) || `فشل الطلب برمز الحالة: ${response.status}`);
      }

      let resultText = data.text || '';
      
      if (!response.ok || data.error) {
        if (!resultText) {
          resultText = generateSmartFallback(userPromptText, systemInstruction);
        }
      }

      // Clean markdown code fence
      resultText = resultText.trim();
      resultText = resultText.replace(/^\s*```(?:html|xml|text|javascript|typescript|json)?\s*\n?/gi, '');
      resultText = resultText.replace(/\n?\s*```\s*$/g, '');
      resultText = resultText.replace(/```/g, '');

      // Check if this response represents a cover
      const isCoverDetected = resultText.includes('book-front-cover') || 
                             resultText.includes('book-cover') || 
                             resultText.includes('غلاف') ||
                             !!currentImage;

      // Add assistant message to chat
      addMessage('assistant', resultText, data?.sources, currentImage, isCoverDetected);

    } catch (err: any) {
      console.log("[AIAssistant] Falling back to smart synthesizer:", err.message || err);
      try {
        const fallbackText = generateSmartFallback(userPromptText, customSystemInstruction);
        addMessage('assistant', fallbackText);
      } catch (fallbackErr) {
        addMessage('assistant', '⚠️ تم استقبال طلبك ولكن حدث ضغط مؤقت في الاتصال. يمكنك إعادة المحاولة أو تطبيق الأغلفة المجهزة مباشرة من تبويب "غلاف".');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !chatAttachedImage) return;

    const selectedText = editorRef.current?.getSelectionText();
    let fullPrompt = prompt;

    if (selectedText && selectedText.trim() !== '') {
      fullPrompt = `النص المحدد من المستند:\n"${selectedText}"\n\nالأمر المطلوب: ${prompt}`;
    }

    handleSendMessage(fullPrompt);
  };

  const executeSelectionAction = (action: string) => {
    const selectedHtml = editorRef.current?.getSelectionHtml();
    const selectedText = editorRef.current?.getSelectionText();
    
    if (!selectedText || selectedText.trim() === '') {
      alert("يرجى تحديد جزء من النص أولاً لتطبيق هذا الإجراء.");
      return;
    }

    let instruction = "";
    if (action === 'summarize') instruction = "قم بتلخيص النص التالي بأسلوب واضح وموجز.";
    else if (action === 'expand') instruction = "قم بتوسيع النص التالي وإضافة تفاصيل وأمثلة إضافية.";
    else if (action === 'shorten') instruction = "قم باختصار النص التالي مع الحفاظ على المعنى الأساسي.";
    else if (action === 'grammar') instruction = "قم بتصحيح الأخطاء الإملائية والنحوية وعلامات الترقيم في النص التالي.";
    else if (action === 'improve') instruction = "قم بتحسين جودة صياغة النص التالي لجعله أكثر احترافية وبلاغة.";
    else if (action === 'translate') instruction = "قم بترجمة النص التالي بدقة مع الحفاظ على التنسيق والمعنى.";
    else if (action === 'paraphrase') instruction = "قم بإعادة صياغة النص التالي بأسلوب مختلف مع الحفاظ على المعنى.";

    handleSendMessage(`النص المحدد:\n${selectedHtml}\n\nالمطلوب: ${instruction}`);
    setActiveTab('chat');
  };

  const handleGenerateBook = async () => {
    if (!bookElements.trim()) {
      alert('يرجى إدخال محتوى أو عناصر الكتاب المراد توليده.');
      return;
    }
    
    const numPages = parseInt(bookPages) || 3;
    const bookTitle = bookName || documentTitle || 'بدون عنوان';
    let actionPrompt = "";

    if (bookType === 'قصة/رواية') {
      actionPrompt = `أريد تأليف قصة/رواية متكاملة بعنوان "${bookTitle}" بناءً على الأفكار أو العناصر التالية:\n${bookElements}\n\nالفئة العمرية/المستوى: ${bookLevel}\nالنوع: ${bookSubject}\nأسلوب السرد: ${bookStyle}${bookNotes.trim() ? `\nملاحظات: ${bookNotes}` : ''}\n\nعدد الصفحات: ${numPages} صفحات.\n\nالرجاء كتابة محتوى القصة بالكامل بتنسيق HTML مهيكل أنيق مع استخدام الفاصل <hr class="page-break" contenteditable="false"> بين الصفحات.`;
    } else {
      actionPrompt = `أريد تأليف كتاب تعليمي متكامل بعنوان "${bookTitle}" بناءً على العناصر التالية:\n${bookElements}\n\nالمرحلة/المستوى: ${bookLevel}\nالمجال: ${bookSubject}\nالأسلوب: ${bookStyle}${bookNotes.trim() ? `\nملاحظات: ${bookNotes}` : ''}\n\nعدد الصفحات: ${numPages} صفحات.\n\nالرجاء كتابة محتوى الكتاب بالكامل بتنسيق HTML مهيكل أنيق مع جداول وصناديق، وإدراج العلامة <hr class="page-break" contenteditable="false"> كفاصل بين الصفحات.`;
    }

    // If user attached an image for book cover or requested cover, notify assistant
    if (bookCoverAttachedImage) {
      actionPrompt += `\n\nملاحظة: تم إرفاق صورة غلاف مخصصة للكتاب لاستخدامها في تصميم الغلاف.`;
    }

    setActiveTab('chat');
    
    if (generateBookCover) {
      // If book cover requested, apply cover with shapes directly after generation
      setTimeout(() => {
        handleApplyCoverToDocument({
          placement: bookCoverPlacement,
          imageUrl: bookCoverAttachedImage?.dataUrl,
          title: bookTitle,
          subtitle: `تأليف: ${bookType} (${bookSubject})`,
          useShapes: bookUseShapes
        });
      }, 1000);
    }

    handleSendMessage(
      actionPrompt, 
      `أنت مؤلف كتب وروايات محترف. اكتب محتوى كاملاً وغنياً جداً. التزم بتقسيم المحتوى إلى ${numPages} صفحات بتنسيق HTML أنيق باستخدام فواصل الصفحات <hr class="page-break" contenteditable="false">.`,
      true
    );
  };

  const handleGenerateCoverWithAI = async () => {
    const promptText = coverPrompt.trim() || coverCustomTitle.trim() || documentTitle.trim() || 'غلاف كتاب فني ومعرفي';
    
    setIsLoading(true);
    addMessage('user', `صمم لي غلافاً للذكاء الاصطناعي: ${promptText} (النمط: ${coverStyle})، وضعه غلافاً في ${coverPlacement === 'both_pages' ? 'أول صفحة وآخر صفحة' : coverPlacement === 'first_page' ? 'أول صفحة' : 'آخر صفحة'} مع استخدام الأشكال.`);
    setActiveTab('chat');

    try {
      let generatedImageUrl: string | null = null;

      // Try image generation API
      try {
        const response = await fetch('/api/gemini/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: `تصميم غلاف كتاب احترافي: ${promptText}. النمط: ${coverStyle}. بدون نصوص مجهزة.`,
            aspectRatio: "3:4"
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.imageUrl) {
            generatedImageUrl = data.imageUrl;
          }
        }
      } catch (imgErr) {
        console.log("Image generation error, utilizing attached or stylized cover:", imgErr);
      }

      const finalImg = generatedImageUrl || coverAttachedImage?.dataUrl;

      // Generate front & back cover HTML
      const frontHtml = generateFrontCoverHtml({
        title: coverCustomTitle || documentTitle || 'عنوان الكتاب',
        subtitle: coverSubtitle,
        author: coverAuthor,
        imageUrl: finalImg,
        theme: coverShapeTheme
      });

      const backHtml = generateBackCoverHtml({
        title: coverCustomTitle || documentTitle || 'عنوان الكتاب',
        synopsis: coverSynopsis,
        author: coverAuthor,
        theme: coverShapeTheme
      });

      const combinedHtml = coverPlacement === 'both_pages'
        ? `${frontHtml}<hr class="page-break" contenteditable="false">${backHtml}`
        : coverPlacement === 'first_page'
        ? frontHtml
        : backHtml;

      addMessage('assistant', combinedHtml, undefined, finalImg, true);

      // Auto-apply if requested
      handleApplyCoverToDocument({
        placement: coverPlacement,
        imageUrl: finalImg,
        title: coverCustomTitle || documentTitle,
        subtitle: coverSubtitle,
        author: coverAuthor,
        synopsis: coverSynopsis,
        useShapes: useShapesForCover,
        theme: coverShapeTheme
      });

    } catch (err: any) {
      console.log("Cover generation note:", err.message || err);
      // Direct graceful fallback application
      handleApplyCoverToDocument({
        placement: coverPlacement,
        imageUrl: coverAttachedImage?.dataUrl,
        title: coverCustomTitle || documentTitle,
        useShapes: useShapesForCover,
        theme: coverShapeTheme
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-[100vw] sm:w-[440px] md:w-[500px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl z-30 transition-all font-sans select-none">
      
      {/* Hidden File Inputs for Image Attachments */}
      <input 
        type="file" 
        ref={chatFileInputRef} 
        onChange={(e) => handleImageFilePick(e, 'chat')} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={coverFileInputRef} 
        onChange={(e) => handleImageFilePick(e, 'cover')} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={bookFileInputRef} 
        onChange={(e) => handleImageFilePick(e, 'book')} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-xs">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white text-base">مساعد التأليف والأغلفة الذكي</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">إرفاق الصور وتصميم الأغلفة بالأشكال التفاعلية</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer">
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/60 p-1 gap-1">
        <button 
          onClick={() => setActiveTab('chat')} 
          className={cn("flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer", activeTab === 'chat' ? "bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900")}
        >
          <BotIcon className="w-3.5 h-3.5" />
          محادثة AI
        </button>
        <button 
          onClick={() => setActiveTab('cover')} 
          className={cn("flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer", activeTab === 'cover' ? "bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900")}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          غلاف وأشكال
        </button>
        <button 
          onClick={() => setActiveTab('book')} 
          className={cn("flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer", activeTab === 'book' ? "bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900")}
        >
          <BookOpenIcon className="w-3.5 h-3.5" />
          تأليف كتاب
        </button>
        <button 
          onClick={() => setActiveTab('selection')} 
          className={cn("flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer", activeTab === 'selection' ? "bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900")}
        >
          <Edit3Icon className="w-3.5 h-3.5" />
          تعديل محدد
        </button>
      </div>

      {/* Web Search Toggle Bar */}
      <div className="px-3 py-1.5 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-200 font-semibold text-[11px]">
          <SearchIcon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          <span>البحث المباشر في الويب (Google Grounding):</span>
        </div>
        <button
          onClick={() => setEnableWebSearch(!enableWebSearch)}
          className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
            enableWebSearch 
              ? "bg-indigo-600 text-white shadow-2xs" 
              : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          )}
        >
          {enableWebSearch ? "مُفعل ⚡" : "معطل"}
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-4">
        
        {/* ===================== TAB: CHAT ===================== */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full gap-3">
            
            {/* Quick Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button 
                onClick={() => handleSendMessage("اقترح عنواناً مبدعاً ومناسباً للمستند الحالي بناءً على محتواه.")}
                className="shrink-0 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
              >
                ✨ عنوان مبدع
              </button>
              <button 
                onClick={() => {
                  setActiveTab('cover');
                }}
                className="shrink-0 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-full transition-colors flex items-center gap-1 cursor-pointer border border-amber-200 dark:border-amber-800"
              >
                🎨 تصميم غلاف بالأشكال
              </button>
              <button 
                onClick={() => handleSendMessage("ابحث عن مصادر ومعلومات ومراجع حديثة حول موضوع هذا المستند.")}
                className="shrink-0 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
              >
                🔍 بحث في المصادر
              </button>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex flex-col rounded-xl p-3 sm:p-4 transition-all text-xs sm:text-sm leading-relaxed",
                    msg.role === 'user'
                      ? "bg-primary-600 text-white mr-6 shadow-sm rounded-br-none"
                      : "bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 ml-2 border border-slate-200 dark:border-slate-700/60 shadow-xs rounded-bl-none"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5 opacity-80 text-[11px] font-semibold border-b border-black/5 dark:border-white/5 pb-1">
                    <span>{msg.role === 'user' ? 'أنت' : 'المساعد الذكي'}</span>
                    <span className="text-[10px] opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Render Attached Image preview in message if present */}
                  {msg.imageUrl && (
                    <div className="mb-2 max-w-[240px] rounded-lg overflow-hidden border border-white/20 shadow-xs">
                      <img src={msg.imageUrl} alt="مرفق" className="w-full max-h-48 object-cover" />
                    </div>
                  )}

                  {/* Render content */}
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div 
                      className="prose dark:prose-invert max-w-none text-xs sm:text-sm" 
                      dangerouslySetInnerHTML={{ __html: msg.content }} 
                    />
                  )}

                  {/* Web Search Sources list if available */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1">
                        <ExternalLinkIcon className="w-3 h-3" />
                        المصادر والمراجع المعتمدة من الويب:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, i) => (
                          <a 
                            key={i} 
                            href={src.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md hover:bg-indigo-50 transition-colors truncate max-w-[200px] flex items-center gap-1 shadow-2xs"
                          >
                            <span>🌐</span>
                            <span className="truncate">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Action Buttons */}
                  {msg.role === 'assistant' && msg.id !== 'welcome-1' && (
                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
                      
                      {/* Cover Specific Placement Buttons */}
                      <button 
                        onClick={() => handleApplyCoverToDocument({ placement: 'first_page', imageUrl: msg.imageUrl })}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="وضع هذا المحتوى كغلاف في أول صفحة مع الأشكال التفاعلية"
                      >
                        <LayersIcon className="w-3.5 h-3.5" />
                        🥇 غلاف أول صفحة
                      </button>

                      <button 
                        onClick={() => handleApplyCoverToDocument({ placement: 'last_page', imageUrl: msg.imageUrl })}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="وضع هذا المحتوى كغلاف في آخر صفحة مع الأشكال"
                      >
                        <LayersIcon className="w-3.5 h-3.5" />
                        🏁 غلاف آخر صفحة
                      </button>

                      <button 
                        onClick={() => handleApplyCoverToDocument({ placement: 'both_pages', imageUrl: msg.imageUrl })}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="تطبيق غلاف أمامي في أول صفحة وغلاف خلفي في آخر صفحة مع الأشكال"
                      >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        👑 الغلافين معاً بالأشكال
                      </button>

                      <button 
                        onClick={() => applyContentToDocument(msg.content, 'insert')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="إدراج هذا النص في مكان المؤشر بالمستند"
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                        📌 إدراج بالمؤشر
                      </button>

                      <button 
                        onClick={() => handleModifyContent(msg.content)}
                        className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="طلب تعديل أو تحسين هذا النص من الذكاء الاصطناعي"
                      >
                        <Edit3Icon className="w-3.5 h-3.5 text-amber-500" />
                        ✏️ تعديل
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 flex items-center gap-3 text-slate-500 border border-slate-200 dark:border-slate-700">
                  <RefreshCwIcon className="w-5 h-5 animate-spin text-primary-500" />
                  <span className="text-xs font-semibold">جاري التفكير والتصميم المباشر...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Form with Image Attachment */}
            <form onSubmit={handleCustomCommandSubmit} className="mt-auto pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              
              {/* Attached Image Preview in Chat */}
              {chatAttachedImage && (
                <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 p-2 rounded-xl text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img src={chatAttachedImage.dataUrl} alt="معاينة" className="w-8 h-8 rounded object-cover border border-primary-300" />
                    <div className="truncate">
                      <span className="font-bold text-primary-900 dark:text-primary-200 block truncate">{chatAttachedImage.name}</span>
                      <span className="text-[10px] text-primary-600 dark:text-primary-400">صورة مرفقة للذكاء الاصطناعي</span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setChatAttachedImage(null)}
                    className="p-1 hover:bg-primary-200 dark:hover:bg-primary-800 text-primary-700 rounded-full transition-colors cursor-pointer"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="relative flex items-center">
                <textarea
                  ref={promptInputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCustomCommandSubmit(e);
                    }
                  }}
                  placeholder="اكتب طلبك أو اطلب تصميم غلاف للصورة... (Shift+Enter لسطر جديد)"
                  className="w-full resize-none p-3 pl-20 pr-3 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-800 dark:text-white shadow-inner min-h-[50px] max-h-[120px]"
                  rows={2}
                />
                
                <div className="absolute left-2 flex items-center gap-1">
                  {/* Image Attachment Button */}
                  <button
                    type="button"
                    onClick={() => chatFileInputRef.current?.click()}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg transition-colors cursor-pointer"
                    title="إرفاق صورة للذكاء الاصطناعي من جهازك"
                  >
                    <PaperclipIcon className="w-4 h-4" />
                  </button>

                  {/* Send Button */}
                  <button 
                    type="submit" 
                    disabled={(!prompt.trim() && !chatAttachedImage) || isLoading} 
                    className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center cursor-pointer shadow-xs"
                    title="إرسال الطلب"
                  >
                    <SendIcon className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ===================== TAB: COVER & SHAPES ===================== */}
        {activeTab === 'cover' && (
          <div className="flex flex-col gap-4">
            
            {/* Header info */}
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-bold block mb-1">🎨 ميزة الغلاف المتكامل مع الأشكال الذكية:</span>
              يمكنك إرفاق صورتك الخاصة أو توليدها لوضعها كغلاف في <strong>أول صفحة</strong> أو <strong>آخر صفحة</strong> أو <strong>الصفحتين معاً</strong>، مع تزيينها تلقائياً بأشكال تفاعلية (أشرطة، أوسمة ذهبية، أختام، وأطر هندسية).
            </div>

            {/* 1. Image Attachment Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-800/40">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2 flex items-center gap-1.5">
                <PaperclipIcon className="w-4 h-4 text-primary-600" />
                <span>إرفاق صورة الغلاف (من جهازك):</span>
              </label>

              {coverAttachedImage ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-primary-500 shadow-md bg-white dark:bg-slate-800 p-2">
                  <div className="flex items-center gap-3">
                    <img 
                      src={coverAttachedImage.dataUrl} 
                      alt="معاينة الغلاف" 
                      className="w-20 h-24 object-cover rounded-lg border border-slate-200 shadow-2xs" 
                    />
                    <div className="flex-1 overflow-hidden">
                      <span className="font-bold text-xs text-slate-800 dark:text-white block truncate">{coverAttachedImage.name}</span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">جاهزة للاستخدام كغلاف</span>
                      
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => coverFileInputRef.current?.click()}
                          className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-950 px-2.5 py-1 rounded-md border border-primary-200 cursor-pointer"
                        >
                          تغيير الصورة
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoverAttachedImage(null)}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950 px-2.5 py-1 rounded-md border border-red-200 cursor-pointer"
                        >
                          إزالة
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => coverFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white dark:bg-slate-800/80 group"
                >
                  <UploadIcon className="w-7 h-7 mx-auto text-slate-400 group-hover:text-primary-500 transition-colors mb-1.5" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">انقر لرفع صورة الغلاف من جهازك</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">يدعم JPG, PNG, WEBP حتى 12 ميجابايت</span>
                </div>
              )}
            </div>

            {/* 2. Cover Placement Selection */}
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2 flex items-center gap-1.5">
                <LayersIcon className="w-4 h-4 text-amber-500" />
                <span>موقع وضع الغلاف في المستند:</span>
              </label>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                <button
                  type="button"
                  onClick={() => setCoverPlacement('first_page')}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer",
                    coverPlacement === 'first_page'
                      ? "bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 shadow-2xs"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className="text-base">🥇</span>
                  <span>أول صفحة</span>
                  <span className="text-[10px] font-normal opacity-70">غلاف أمامي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCoverPlacement('last_page')}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer",
                    coverPlacement === 'last_page'
                      ? "bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 shadow-2xs"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className="text-base">🏁</span>
                  <span>آخر صفحة</span>
                  <span className="text-[10px] font-normal opacity-70">غلاف خلفي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCoverPlacement('both_pages')}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer",
                    coverPlacement === 'both_pages'
                      ? "bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 shadow-2xs"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className="text-base">👑</span>
                  <span>الصفحتان معاً</span>
                  <span className="text-[10px] font-normal opacity-70">أمامي وخلفي</span>
                </button>
              </div>
            </div>

            {/* 3. Shapes & Styling Options */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col gap-2.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                <input 
                  type="checkbox" 
                  checked={useShapesForCover} 
                  onChange={(e) => setUseShapesForCover(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <PaletteIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>تزيين الغلاف بالأشكال التفاعلية (أشرطة، أوسمة، أختام)</span>
                </span>
              </label>

              {useShapesForCover && (
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">نمط وألوان الأشكال:</span>
                  <select 
                    value={coverShapeTheme} 
                    onChange={(e) => setCoverShapeTheme(e.target.value as ShapeStyleTheme)}
                    className="w-full p-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white bg-white outline-none cursor-pointer"
                  >
                    <option value="royal_gold">🌟 ذهبي ملكي (Royal Gold) - أوسمة وأشرطة ذهبية</option>
                    <option value="modern_indigo">💎 نيلي عصري (Modern Indigo) - طابع تكنولوجي راقٍ</option>
                    <option value="emerald_luxury">🌿 زمردي فاخر (Emerald Luxury) - هيبة وأناقة علمية</option>
                    <option value="geometric_minimal">📐 هندسي بسيط (Geometric Minimal) - خطوط ومعينات كلاسيكية</option>
                    <option value="crimson_classic">🌹 قرمزي تراثي (Crimson Classic) - رونق الأدب والقصص</option>
                  </select>
                </div>
              )}
            </div>

            {/* 4. Book Cover Details */}
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">عنوان الكتاب / المستند</label>
                <input 
                  type="text" 
                  value={coverCustomTitle} 
                  onChange={(e) => setCoverCustomTitle(e.target.value)}
                  placeholder="عنوان الكتاب على الغلاف..."
                  className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم المؤلف</label>
                  <input 
                    type="text" 
                    value={coverAuthor} 
                    onChange={(e) => setCoverAuthor(e.target.value)}
                    placeholder="اسم المؤلف..."
                    className="w-full p-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">عنوان فرعي / تصنيف</label>
                  <input 
                    type="text" 
                    value={coverSubtitle} 
                    onChange={(e) => setCoverSubtitle(e.target.value)}
                    placeholder="مثال: رواية أدبية، كتاب جامعي..."
                    className="w-full p-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {(coverPlacement === 'last_page' || coverPlacement === 'both_pages') && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">نبذة الغلاف الخلفي (Synopsis)</label>
                  <textarea 
                    value={coverSynopsis} 
                    onChange={(e) => setCoverSynopsis(e.target.value)}
                    placeholder="نبذة تشويقية أو ملخص محتوى الكتاب للغلاف الخلفي..."
                    rows={3}
                    className="w-full p-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white resize-none"
                  />
                </div>
              )}
            </div>

            {/* 5. Primary Application Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => handleApplyCoverToDocument({
                  placement: coverPlacement,
                  imageUrl: coverAttachedImage?.dataUrl,
                  title: coverCustomTitle || documentTitle,
                  subtitle: coverSubtitle,
                  author: coverAuthor,
                  synopsis: coverSynopsis,
                  useShapes: useShapesForCover,
                  theme: coverShapeTheme
                })}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer text-xs sm:text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                تطبيق الغلاف مع الأشكال في {coverPlacement === 'both_pages' ? 'أول صفحة وآخر صفحة' : coverPlacement === 'first_page' ? 'أول صفحة' : 'آخر صفحة'}
              </button>

              <button 
                onClick={handleGenerateCoverWithAI}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer text-xs disabled:opacity-50"
              >
                <SparklesIcon className="w-4 h-4" />
                توليد صورة غلاف جديدة بالذكاء الاصطناعي وتطبيقها
              </button>
            </div>

          </div>
        )}

        {/* ===================== TAB: BOOK CREATION ===================== */}
        {activeTab === 'book' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              أدخل عناصر وموضوع الكتاب لتأليف كامل فصوله تلقائياً وتزيينه بغلاف فني وأشكال تفاعلية:
            </p>

            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-bold">نوع المؤلف</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBookType('كتاب تعليمي')}
                  className={cn("py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer", bookType === 'كتاب تعليمي' ? "bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300")}
                >
                  كتاب تعليمي / مرجع
                </button>
                <button
                  type="button"
                  onClick={() => setBookType('قصة/رواية')}
                  className={cn("py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer", bookType === 'قصة/رواية' ? "bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300")}
                >
                  قصة / رواية أدبية
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-bold">عنوان الكتاب المقترح</label>
              <input 
                type="text" 
                value={bookName} 
                onChange={(e) => setBookName(e.target.value)}
                placeholder="مثال: مقدمة في علوم البيانات..."
                className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-bold">العناصر والمحاور الأساسية *</label>
              <textarea
                value={bookElements}
                onChange={(e) => setBookElements(e.target.value)}
                placeholder="اكتب العناصر أو الفصول المطلوب تغطيتها في الكتاب..."
                className="w-full resize-none p-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-bold">عدد الصفحات</label>
                <select 
                  value={bookPages} 
                  onChange={(e) => setBookPages(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white bg-white"
                >
                  <option value="2">صفحتان (2)</option>
                  <option value="3">3 صفحات</option>
                  <option value="4">4 صفحات</option>
                  <option value="5">5 صفحات</option>
                  <option value="7">7 صفحات</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 block mb-1 font-bold">المستوى / الفئة</label>
                <input 
                  type="text" 
                  value={bookLevel} 
                  onChange={(e) => setBookLevel(e.target.value)}
                  placeholder="جامعي، عام، مبتدئ..."
                  className="w-full p-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Book Cover & Shapes Settings */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                <input 
                  type="checkbox" 
                  checked={generateBookCover} 
                  onChange={(e) => setGenerateBookCover(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <span>إنشاء غلاف وتزيينه بالأشكال التفاعلية تلقائياً</span>
              </label>

              {generateBookCover && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">موضع الغلاف:</span>
                    <select
                      value={bookCoverPlacement}
                      onChange={(e) => setBookCoverPlacement(e.target.value as CoverPlacement)}
                      className="p-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white bg-white"
                    >
                      <option value="first_page">أول صفحة (غلاف أمامي)</option>
                      <option value="last_page">آخر صفحة (غلاف خلفي)</option>
                      <option value="both_pages">الصفحتان معاً (أمامي وخلفي)</option>
                    </select>
                  </div>

                  {/* Optional Book Cover Image Upload */}
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => bookFileInputRef.current?.click()}
                      className="text-primary-600 dark:text-primary-400 text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <PaperclipIcon className="w-3.5 h-3.5" />
                      {bookCoverAttachedImage ? `تم إرفاق: ${bookCoverAttachedImage.name}` : "إرفاق صورة غلاف من جهازك"}
                    </button>
                    {bookCoverAttachedImage && (
                      <button 
                        type="button" 
                        onClick={() => setBookCoverAttachedImage(null)} 
                        className="text-red-500 text-xs hover:underline cursor-pointer"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleGenerateBook} 
              disabled={!bookElements.trim() || isLoading}
              className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <BookOpenIcon className="w-4 h-4" /> بدء التأليف التفاعلي المباشر
            </button>
          </div>
        )}

        {/* ===================== TAB: SELECTION ACTIONS ===================== */}
        {activeTab === 'selection' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              اختر إجراءً سريعاً لتطبيقه مباشرة على النص المحدد في المستند:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => executeSelectionAction('grammar')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer">
                <CheckIcon className="w-5 h-5 text-green-600" />
                <span className="text-xs font-bold dark:text-slate-200">تصحيح أخطاء</span>
              </button>
              <button onClick={() => executeSelectionAction('improve')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer">
                <SparklesIcon className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-bold dark:text-slate-200">تحسين الصياغة</span>
              </button>
              <button onClick={() => executeSelectionAction('summarize')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer">
                <ChevronDownIcon className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-bold dark:text-slate-200">تلخيص النص</span>
              </button>
              <button onClick={() => executeSelectionAction('expand')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer">
                <PlusIcon className="w-5 h-5 text-purple-500" />
                <span className="text-xs font-bold dark:text-slate-200">توسيع وشرح</span>
              </button>
              <button onClick={() => executeSelectionAction('translate')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer">
                <LanguagesIcon className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-bold dark:text-slate-200">ترجمة دقيقة</span>
              </button>
              <button onClick={() => executeSelectionAction('paraphrase')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer">
                <RefreshCwIcon className="w-5 h-5 text-teal-500" />
                <span className="text-xs font-bold dark:text-slate-200">إعادة صياغة</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIAssistant;
