import React, { useState } from 'react';
import { BotIcon, SparklesIcon, XIcon, CheckIcon, RefreshCwIcon, ChevronDownIcon, LayersIcon, BookOpenIcon, LanguagesIcon, ImageIcon } from 'lucide-react';
import { EditorHandle } from './Editor';
import { cn } from '../lib/utils';

interface AIAssistantProps {
  editorRef: React.RefObject<EditorHandle>;
  isOpen: boolean;
  onClose: () => void;
  documentContent: string;
  documentTitle: string;
  onUpdateTitle: (title: string) => void;
  onSetContent: (html: string) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  editorRef, isOpen, onClose, documentContent, documentTitle, onUpdateTitle, onSetContent 
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'selection' | 'document' | 'book' | 'cover'>('chat');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewAction, setPreviewAction] = useState<'replace' | 'insert' | 'title' | 'document'>('replace');
  
  // Book Generation state
  const [bookType, setBookType] = useState('كتاب أكاديمي/تعليمي');
  const [bookName, setBookName] = useState('');
  const [bookElements, setBookElements] = useState('');
  const [bookLevel, setBookLevel] = useState('جامعي');
  const [bookSubject, setBookSubject] = useState('عام');
  const [bookStyle, setBookStyle] = useState('شرح مفصل مع أمثلة');
  const [bookNotes, setBookNotes] = useState('');
  const [bookPages, setBookPages] = useState('3');
  
  // Cover Generation state
  const [coverPrompt, setCoverPrompt] = useState('');
  const [coverStyle, setCoverStyle] = useState('واقعي ومفصل');
  
  const handleGenerate = async (actionPrompt: string, systemInstruction?: string, actionType: 'replace' | 'insert' | 'title' | 'document' = 'replace', prefixHtml: string = '') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: actionPrompt,
          systemInstruction: systemInstruction || "أنت مساعد ذكي متقدم في تحرير وتأليف المستندات وتنسيقها. أجب بالغة العربية، وقم بإرجاع النص المنسق باستخدام HTML نظيف ومباشر فقط ليتم عرضه في المستند مباشرة. يمنع منعاً باتاً إضافة أو استخدام علامات برمجة أو رموز أو اقتباسات برمجية مثل علامات الاقتباس الخلفية (\`\`\`) أو تغليفات مثل ```html أو أي أكواد برمجية. نريد فقط رموز واضحة وعلامات ونصوصاً منسقة ومنظمة بدون أي كود برمجي. إذا كان المستند طويلاً أو يحتوي على فصول أو أقسام متعددة، أو إذا طُلب منك تقسيم الصفحات أو إدراج فاصل صفحات، فيجب عليك إدراج العلامة <hr class=\"page-break\" contenteditable=\"false\"> لإنشاء فواصل صفحات واضحة بين الفصول أو الأقسام ليظهر كل منها في صفحة مستقلة.",
          model: "gemini-3.5-flash"
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Server error response text:", text);
        if (text.includes("<!DOCTYPE html>") || text.includes("<html") || text.includes("504 Gateway Time-out")) {
          throw new Error("استجابة غير صالحة من الخادم (HTML/Timeout). غالباً ما يحدث هذا بسبب انتهاء مهلة الاتصال (Timeout) لطلب طويل جداً على منصة الاستضافة (Vercel)، أو بسبب عدم تهيئة مفتاح GEMINI_API_KEY في إعدادات البيئة (Environment Variables) بموقعك على Vercel. يرجى تهيئة مفتاح GEMINI_API_KEY أو اختيار عدد صفحات أصغر للتوليد.");
        }
        try {
          const errData = JSON.parse(text);
          throw new Error(errData.error || errData.message || "حدث خطأ غير معروف في الخادم");
        } catch {
          throw new Error(text.substring(0, 300) || `فشل الطلب برمز الحالة: ${response.status}`);
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error("لم يقم الخادم بإرجاع استجابة JSON صالحة. الاستجابة المستلمة: " + text.substring(0, 150));
      }

      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      let resultText = data.text || '';
      
      // Clean up markdown code blocks extremely robustly
      resultText = resultText.trim();
      
      // Remove opening and closing backticks of any markdown code blocks
      resultText = resultText.replace(/^\s*```(?:html|xml|text|javascript|typescript|json)?\s*\n?/gi, '');
      resultText = resultText.replace(/\n?\s*```\s*$/g, '');
      
      // Clean any lingering backticks globally to ensure no raw code ticks are rendered
      resultText = resultText.replace(/```/g, '');
      
      setPreviewContent(prefixHtml + resultText.trim());
      setPreviewAction(actionType);
    } catch (err: any) {
      alert("حدث خطأ أثناء معالجة طلبك: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreview = () => {
    if (!previewContent) return;
    
    switch (previewAction) {
      case 'replace':
        editorRef.current?.replaceSelectionHtml(previewContent);
        break;
      case 'insert':
        editorRef.current?.insertHtmlAtCursor(previewContent);
        break;
      case 'title':
        onUpdateTitle(previewContent.replace(/<[^>]*>?/gm, '').trim()); // Strip HTML for title
        break;
      case 'document':
        editorRef.current?.setHtml(previewContent);
        break;
    }
    setPreviewContent(null);
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

    handleGenerate(`النص المحدد:\n${selectedHtml}\n\nالمطلوب: ${instruction}`, "حافظ على التنسيقات الأصلية (HTML) ما أمكن، وأرجع النتيجة بتنسيق HTML صالح للوضع داخل محرر.", 'replace');
  };

  const handleCustomCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    const selectedHtml = editorRef.current?.getSelectionHtml();
    let fullPrompt = prompt;
    let actionType: 'insert' | 'replace' | 'document' = 'insert';
    
    if (selectedHtml && selectedHtml.trim() !== '') {
       fullPrompt = `بناءً على هذا النص المحدد:\n${selectedHtml}\n\nنفذ الأمر التالي: ${prompt}\n\nإذا كان الأمر يتطلب تعديل النص المحدد، فأرجع النص المعدل. وإذا كان يتطلب إضافة شيء جديد، فأرجع الإضافة فقط.`;
       actionType = 'replace'; // assume we replace or we might want to insert. Let's stick to replace if text is selected.
    } else {
       fullPrompt = `المستند الحالي:\n${documentContent}\n\nنفذ الأمر التالي: ${prompt}\nأرجع المحتوى الجديد ليتم إدراجه في المستند.`;
    }

    handleGenerate(fullPrompt, undefined, actionType);
    setPrompt('');
  };

  const handleGenerateBook = async () => {
    if (!bookElements.trim()) {
      alert('يرجى إدخال محتوى أو عناصر الكتاب المراد توليده.');
      return;
    }
    
    const numPages = parseInt(bookPages) || 3;
    let actionPrompt = "";
    
    setIsLoading(true);
    let coverHtml = "";
    try {
        const bookTitle = bookName || 'بدون عنوان';
        const coverPromptText = `تصميم غلاف ${bookType === 'قصة/رواية' ? 'قصة' : 'كتاب'} بعنوان "${bookTitle}". الموضوع: ${bookSubject}. الفئة/المستوى: ${bookLevel}. عناصر أساسية: ${bookElements.substring(0, 100)}. ركز على تصميم غلاف فني واحترافي خالي تماما من أي نص أو كلمات.`;
        
        const response = await fetch('/api/gemini/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: coverPromptText,
            aspectRatio: "3:4"
          })
        });

        const data = await response.json();
        if (response.ok && !data.error) {
           coverHtml = `<div style="text-align: center;"><img src="${data.imageUrl}" alt="غلاف الكتاب" style="max-width: 100%; max-height: 800px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 24px;" /></div><hr class="page-break" contenteditable="false">`;
        }
    } catch (e) {
        console.warn("Cover generation failed:", e);
    }
    
    if (bookType === 'قصة/رواية') {
      actionPrompt = `أريد تأليف قصة/رواية متكاملة بعنوان "${bookName || 'بدون عنوان'}" بناءً على الأفكار أو العناصر التالية:\n${bookElements}\n\nالفئة العمرية/المستوى: ${bookLevel}\nالنوع (خيال، مغامرة، دراما...): ${bookSubject}\nأسلوب السرد: ${bookStyle}${bookNotes.trim() ? `\nملاحظات إضافية: ${bookNotes}` : ''}\n\nعدد الصفحات المطلوب: ${numPages} صفحات.\n\nالرجاء كتابة محتوى القصة بالكامل بحيث يشمل:\n- مقدمة أو بداية مشوقة.\n- فصول وأحداث القصة متسلسلة بشكل واضح.\n- حوارات الشخصيات إن وجدت.\n- الخاتمة.\n\nاستخدم تنسيق HTML مهيكل بشكل جيد (h1, h2, p, etc) بحيث يكون جاهزاً للمستند.\n\nهام جداً: يمنع منعاً باتاً كتابة أو عرض الرد بأقواس أو علامات برمجية. أرجع فقط نصوصاً منسقة بـ HTML نظيف.\n\nهام جداً: التزم التزاماً دقيقاً بعدد الصفحات المطلوب (${numPages} صفحات). يجب عليك تقسيم محتوى القصة بالتساوي ليتوزع على ${numPages} صفحات تماماً. لإنشاء صفحة جديدة، استخدم العلامة <hr class="page-break" contenteditable="false"> بالضبط كفاصل صفحات. يجب أن يحتوي الملف النهائي على ${numPages - 1} من فواصل الصفحات بالضبط.`;
    } else {
      actionPrompt = `أريد تأليف كتاب تعليمي متكامل بعنوان "${bookName || 'بدون عنوان'}" بناءً على العناصر التالية:\n${bookElements}\n\nالمرحلة الدراسية/المستوى: ${bookLevel}\nالموضوع/المجال: ${bookSubject}\nأسلوب الشرح: ${bookStyle}${bookNotes.trim() ? `\nملاحظات إضافية: ${bookNotes}` : ''}\n\nعدد الصفحات المطلوب: ${numPages} صفحات.\n\nالرجاء كتابة محتوى الكتاب بالكامل بحيث يشمل:\n- مقدمة شاملة.\n- فصول الكتاب مع شرح أصلي وافٍ لكل عنصر.\n- ملخص لكل فصل.\n- تمارين واختبارات مع إجاباتها في نهاية الكتاب.\n\nاستخدم أنواعًا مختلفة حسب طبيعة المحتوى باستخدام تنسيق HTML مناسب (مثل الصناديق أو الأيقونات النصية):\n📘 تعريف → للمصطلحات والتعريفات.\n💡 ملحوظة → للمعلومات الإضافية المهمة.\n⚠️ تنبيه → للأخطاء الشائعة أو الأشياء التي يجب الانتباه إليها.\n⭐ معلومة مهمة → للمعلومات التي يجب حفظها.\n🧠 تذكر → للنقاط التي يحتاج الطالب إلى حفظها.\n❓ فكر → لسؤال يحفز الطالب على التفكير.\n📝 مثال → للأمثلة التطبيقية.\n\nالتفاعل بين النص والرسومات (باستخدام وصف للرسوم كعنصر نائب إذا لزم الأمر):\n- حدد أفضل مكان بحيث يأتي الرسم بعد الفكرة التي يشرحها مباشرة ولا يقطع تسلسل الشرح.\n- ضع تعليق أسفل الرسم، مثل: «شكل (1): ...».\n- مهم جدًا: لا تنشئ رسمًا لمجرد وجود مساحة. اسأل نفسك: هل سيساعد الطالب على الفهم؟ إذا كانت الإجابة نعم، أنشئه.\n\nقواعد التصميم والتنسيق:\n- استخدم تنسيق HTML مهيكل بشكل جيد (h1, h2, p, ul, table, blockquote, div مع أنماط CSS مضمنة بسيطة للصناديق).\n- تسلسل بصري واضح، مسافات مناسبة، صناديق معلومات منظمة، وجداول عند الحاجة لدعم اللغة العربية واتجاه RTL.\n\nهام جداً: يمنع منعاً باتاً كتابة أو عرض أو تغليف الرد بأقواس أو علامات برمجية مثل علامات الاقتباس الخلفية (\`\`\`). أرجع فقط نصوصاً منسقة بـ HTML نظيف وصالح مباشرة.\n\nهام جداً: التزم التزاماً دقيقاً بعدد الصفحات المطلوب (${numPages} صفحات). يجب عليك تقسيم محتوى الكتاب بالتساوي ليتوزع على ${numPages} صفحات تماماً. لإنشاء صفحة جديدة، استخدم العلامة <hr class="page-break" contenteditable="false"> بالضبط كفاصل صفحات. يجب أن يحتوي الملف النهائي على ${numPages - 1} من فواصل الصفحات بالضبط.`;
    }
    
    // We pass coverHtml as the 4th argument to handleGenerate, which prepend it to the document
    handleGenerate(actionPrompt, `أنت مؤلف خبير. اكتب محتوى غنياً ومنظماً جداً. أرجع HTML نظيف وصالح مباشرة للرد. يمنع منعاً باتاً إضافة أي كود برمجي أو علامات اقتباس خلفية (\`\`\`). هام جداً: التزم التزاماً صارماً بتقسيم المحتوى إلى ${numPages} صفحات تماماً عن طريق إدراج العلامة <hr class="page-break" contenteditable="false"> كفاصل بين الصفحات (يجب أن تدرج ${numPages - 1} من فواصل الصفحات).`, 'document', coverHtml);
  };

  const handleGenerateCover = async () => {
    if (!coverPrompt.trim()) {
      alert('يرجى إدخال وصف للغلاف.');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `تصميم غلاف كتاب: ${coverPrompt}. النمط: ${coverStyle}. ركز على تصميم غلاف فني واحترافي بدون أي نص أو كلمات مكتوبة في الصورة.`,
          aspectRatio: "3:4"
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "فشل توليد الصورة");
      }
      
      const imgHtml = `<div style="text-align: center;"><img src="${data.imageUrl}" alt="غلاف الكتاب" style="max-width: 100%; max-height: 800px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 24px;" /></div><hr class="page-break" contenteditable="false">`;
      setPreviewContent(imgHtml);
      setPreviewAction('insert');
    } catch (err: any) {
      alert("حدث خطأ أثناء معالجة طلبك: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-[100vw] sm:w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col h-full shadow-xl z-20 transition-all">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-primary-600" />
          <h2 className="font-bold text-slate-800 dark:text-white">المساعد الذكي</h2>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => setActiveTab('chat')} 
          className={cn("flex-1 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors", activeTab === 'chat' ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700")}
        >
          أوامر
        </button>
        <button 
          onClick={() => setActiveTab('selection')} 
          className={cn("flex-1 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors", activeTab === 'selection' ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700")}
        >
          تحديد
        </button>
        <button 
          onClick={() => setActiveTab('book')} 
          className={cn("flex-1 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors", activeTab === 'book' ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700")}
        >
          تأليف
        </button>
        <button 
          onClick={() => setActiveTab('cover')} 
          className={cn("flex-1 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors", activeTab === 'cover' ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-700")}
        >
          غلاف
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        
        {previewContent && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3 mb-4 flex flex-col gap-2">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-500 text-sm flex items-center gap-1">
              <EyeIcon className="w-4 h-4" /> معاينة النتيجة
            </h3>
            <div className="max-h-40 overflow-y-auto text-sm bg-white dark:bg-slate-900 p-2 rounded border border-yellow-100 dark:border-yellow-800/30" dangerouslySetInnerHTML={{ __html: previewContent }} />
            <div className="flex gap-2 mt-2">
              <button onClick={applyPreview} className="flex-1 bg-green-600 text-white py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-1 hover:bg-green-700">
                <CheckIcon className="w-4 h-4" /> تطبيق
              </button>
              <button onClick={() => setPreviewContent(null)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-1 hover:bg-slate-300 dark:hover:bg-slate-600">
                <XIcon className="w-4 h-4" /> رفض
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3 text-slate-500">
            <RefreshCwIcon className="w-8 h-8 animate-spin text-primary-500" />
            <span className="text-sm">جاري التفكير...</span>
          </div>
        ) : (
          <>
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  اكتب أي أمر مباشر وسيقوم المساعد بتنفيذه على النص المحدد أو إدراجه في المستند.
                </p>
                <div className="flex flex-col gap-2 mb-4">
                  <button onClick={() => handleGenerate("اقترح عنواناً مناسباً للمستند التالي:\n" + documentContent, "أرجع نص العنوان فقط", 'title')} className="text-right text-sm px-3 py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors">
                    ✨ اقتراح عنوان للمستند
                  </button>
                  <button onClick={() => handleGenerate("قم بإنشاء جدول محتويات (فهرس) منظم بناءً على العناوين الموجودة في هذا المستند:\n" + documentContent, "أرجع الفهرس بتنسيق قائمة HTML (ul, li) مع روابط للعناوين إن أمكن.", 'insert')} className="text-right text-sm px-3 py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors">
                    📑 إنشاء فهرس تلقائي
                  </button>
                  <button onClick={() => handleGenerate("قم بتحليل المستند التالي واقترح تحسينات هيكلية ولغوية:\n" + documentContent, "أرجع التحليل كنقاط في HTML جاهزة للعرض.", 'insert')} className="text-right text-sm px-3 py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors">
                    🔍 تحليل المستند واقتراح تحسينات
                  </button>
                </div>
                
                <form onSubmit={handleCustomCommand} className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="مثال: اكتب خاتمة مناسبة لهذا التقرير..."
                    className="w-full resize-none p-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-700 dark:text-white"
                    rows={4}
                  />
                  <button type="submit" disabled={!prompt.trim()} className="w-full mt-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    <SparklesIcon className="w-4 h-4" /> تنفيذ الأمر
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'selection' && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => executeSelectionAction('grammar')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                  <CheckIcon className="w-5 h-5 text-green-600" />
                  <span className="text-xs font-medium dark:text-slate-200">تصحيح أخطاء</span>
                </button>
                <button onClick={() => executeSelectionAction('improve')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                  <SparklesIcon className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-medium dark:text-slate-200">تحسين الصياغة</span>
                </button>
                <button onClick={() => executeSelectionAction('summarize')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                  <ChevronDownIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-medium dark:text-slate-200">تلخيص</span>
                </button>
                <button onClick={() => executeSelectionAction('expand')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                  <LayersIcon className="w-5 h-5 text-purple-500" />
                  <span className="text-xs font-medium dark:text-slate-200">توسيع النص</span>
                </button>
                <button onClick={() => executeSelectionAction('paraphrase')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                  <RefreshCwIcon className="w-5 h-5 text-teal-500" />
                  <span className="text-xs font-medium dark:text-slate-200">إعادة صياغة</span>
                </button>
                <button onClick={() => executeSelectionAction('translate')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                  <LanguagesIcon className="w-5 h-5 text-indigo-500" />
                  <span className="text-xs font-medium dark:text-slate-200">ترجمة</span>
                </button>
              </div>
            )}

            {activeTab === 'book' && (
              <div className="flex flex-col gap-3 h-full">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  أدخل تفاصيل وسيقوم الذكاء الاصطناعي بتأليف كتاب أو قصة متكاملة.
                </p>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">نوع العمل</label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1 text-xs dark:text-slate-300">
                      <input 
                        type="radio" 
                        name="bookType" 
                        value="كتاب أكاديمي/تعليمي" 
                        checked={bookType === 'كتاب أكاديمي/تعليمي'}
                        onChange={(e) => setBookType(e.target.value)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      كتاب تعليمي
                    </label>
                    <label className="flex items-center gap-1 text-xs dark:text-slate-300">
                      <input 
                        type="radio" 
                        name="bookType" 
                        value="قصة/رواية" 
                        checked={bookType === 'قصة/رواية'}
                        onChange={(e) => setBookType(e.target.value)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      قصة/رواية
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">العنوان</label>
                  <input 
                    type="text" 
                    value={bookName} 
                    onChange={(e) => setBookName(e.target.value)}
                    placeholder={bookType === 'قصة/رواية' ? "مثال: رحلة إلى المجهول..." : "مثال: مبادئ الجغرافيا..."}
                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-700 dark:text-white" 
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">المحتوى / الأفكار</label>
                  <textarea
                    value={bookElements}
                    onChange={(e) => setBookElements(e.target.value)}
                    placeholder={bookType === 'قصة/رواية' ? "اكتب أفكار القصة، الشخصيات، الحبكة..." : "اكتب العناوين أو عناصر المنهج هنا..."}
                    className="w-full resize-none p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-700 dark:text-white"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">الفئة العمرية/المستوى</label>
                    <input 
                      type="text" 
                      value={bookLevel} 
                      onChange={(e) => setBookLevel(e.target.value)}
                      placeholder="أطفال، يافعين، جامعي..."
                      className="w-full p-2 text-xs border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-slate-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">النوع/المجال</label>
                    <input 
                      type="text" 
                      value={bookSubject} 
                      onChange={(e) => setBookSubject(e.target.value)}
                      placeholder={bookType === 'قصة/رواية' ? "خيال علمي، مغامرة..." : "علوم، تاريخ..."}
                      className="w-full p-2 text-xs border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-slate-700 dark:text-white" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">الأسلوب</label>
                    <select 
                      value={bookStyle} 
                      onChange={(e) => setBookStyle(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-slate-700 dark:text-white bg-transparent"
                    >
                      <option value="شرح مفصل مع أمثلة">مفصل</option>
                      <option value="مختصر ومركز">مختصر</option>
                      <option value="أكاديمي ورسمي">أكاديمي</option>
                      <option value="مبسط للأطفال">مبسط (أطفال)</option>
                      <option value="قصصي وتفاعلي">قصصي</option>
                      <option value="درامي ومشوق">درامي (قصص)</option>
                      <option value="كوميدي">كوميدي (قصص)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">عدد الصفحات</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="30"
                      value={bookPages} 
                      onChange={(e) => setBookPages(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-slate-700 dark:text-white" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">ملاحظات أو توجيهات إضافية</label>
                  <textarea
                    value={bookNotes}
                    onChange={(e) => setBookNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية بخصوص الأسلوب أو النقاط الهامة..."
                    className="w-full resize-none p-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-700 dark:text-white"
                    rows={2}
                  />
                </div>

                <button onClick={handleGenerateBook} className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <BookOpenIcon className="w-4 h-4" /> بدء التأليف
                </button>
              </div>
            )}

            {activeTab === 'cover' && (
              <div className="flex flex-col gap-3 h-full">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  قم بإنشاء غلاف فني واحترافي لكتابك أو قصتك لإدراجه في المستند.
                </p>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">وصف الغلاف (الفكرة)</label>
                  <textarea
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                    placeholder="مثال: غلاف لقصة خيال علمي يظهر فيه فتى ينظر إلى كوكب لامع في الفضاء..."
                    className="w-full resize-none p-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-700 dark:text-white"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">النمط الفني</label>
                  <select 
                    value={coverStyle} 
                    onChange={(e) => setCoverStyle(e.target.value)}
                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-slate-700 dark:text-white bg-transparent"
                  >
                    <option value="واقعي ومفصل جدًا 4k">واقعي (Photorealistic)</option>
                    <option value="رسم رقمي (Digital Art) فني واحترافي">رسم رقمي (Digital Art)</option>
                    <option value="أنمي (Anime) بألوان زاهية">أنمي (Anime)</option>
                    <option value="ألوان مائية (Watercolor) هادئة">ألوان مائية (Watercolor)</option>
                    <option value="تصميم جرافيك مسطح وحديث (Flat Design)">تصميم حديث (Modern/Flat)</option>
                    <option value="مرسوم باليد وقلم الرصاص">مرسوم باليد (Sketch)</option>
                    <option value="خيال علمي ومستقبلي (Sci-Fi)">خيال علمي (Sci-Fi)</option>
                    <option value="أجواء سحرية وفانتازيا">فانتازيا (Fantasy)</option>
                  </select>
                </div>

                <button 
                  onClick={handleGenerateCover} 
                  disabled={!coverPrompt.trim()}
                  className="mt-4 w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" /> توليد الصورة
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Add EyeIcon if it doesn't exist in lucide imports up top
function EyeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default AIAssistant;
