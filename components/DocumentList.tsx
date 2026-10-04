import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PlusIcon, FileUpIcon, FileTextIcon, FolderOpenIcon } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  updatedAt?: any;
}

interface DocumentListProps {
  onSelectDocument?: (id: string) => void;
  onCreateDocument?: () => void;
  onOpenDocument?: (file: File) => void;
  // Fallbacks for legacy props
  onSelect?: (id: string) => void;
  onNewDocument?: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  onSelectDocument, 
  onCreateDocument, 
  onOpenDocument,
  onSelect,
  onNewDocument
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSelect = (id: string) => {
    if (onSelectDocument) onSelectDocument(id);
    else if (onSelect) onSelect(id);
  };

  const handleCreate = () => {
    if (onCreateDocument) onCreateDocument();
    else if (onNewDocument) onNewDocument();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && onOpenDocument) {
      onOpenDocument(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onOpenDocument) {
      onOpenDocument(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'documents'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        title: doc.data().title || 'مستند بدون عنوان',
        updatedAt: doc.data().updatedAt
      }));
      setDocuments(docs);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".joed,.docx,.pdf,.txt,.html,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/json" 
        className="hidden" 
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">مستنداتك ومشاريعك</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">محرر النصوص المتقدم بصيغة JOED والأشكال الذكية</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all shadow-xs"
          >
            <FolderOpenIcon className="w-5 h-5 text-emerald-600" />
            <span>فتح ملف (JOED / Word / PDF)</span>
          </button>

          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="w-5 h-5" />
            <span>إنشاء مستند جديد</span>
          </button>
        </div>
      </div>
      
      {/* Drop Zone */}
      <div 
        onDrop={handleDrop} 
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-3xl p-8 text-center mb-8 hover:border-primary-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all bg-white dark:bg-slate-800 cursor-pointer group"
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
          <FileUpIcon className="w-6 h-6" />
        </div>
        <p className="text-slate-700 dark:text-slate-200 font-bold text-base mb-1">
          اسحب وأفلت ملف <span className="text-emerald-600">JOED (.joed)</span> أو <span className="text-blue-600">Word (.docx)</span> أو <span className="text-rose-600">PDF</span> هنا للفتح الفوري
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">أو انقر هنا لتصفح الملفات من جهازك</p>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <FileTextIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-semibold mb-4 text-lg">لا توجد مستندات محفوظة بعد.</p>
          <button onClick={handleCreate} className="text-primary-600 hover:text-primary-700 font-bold text-base bg-primary-50 dark:bg-primary-950/40 px-4 py-2 rounded-xl">
            + ابدأ بإنشاء أول مستند لك الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {documents.map(doc => (
            <div 
              key={doc.id} 
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary-400 transition-all cursor-pointer group flex flex-col justify-between" 
              onClick={() => handleSelect(doc.id)}
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileTextIcon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 truncate group-hover:text-primary-600">
                  {doc.title}
                </h3>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span>فتح وتعديل</span>
                <span>←</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
