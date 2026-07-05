import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PlusIcon } from './icons';

interface Document {
  id: string;
  title: string;
}

const DocumentList: React.FC<{ onSelect: (id: string) => void, onNewDocument: () => void, onOpenDocument: (file: File) => void }> = ({ onSelect, onNewDocument, onOpenDocument }) => {
  const [documents, setDocuments] = useState<Document[]>([]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      onOpenDocument(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'documents'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title }));
      setDocuments(docs);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">مستنداتك</h2>
        <button 
          onClick={onNewDocument}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
        >
          <PlusIcon className="w-5 h-5" />
          <span>إنشاء مستند جديد</span>
        </button>
      </div>
      
      <div 
        onDrop={handleDrop} 
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-slate-300 rounded-3xl p-10 text-center mb-8 hover:border-primary-500 transition-colors bg-white dark:bg-slate-800"
      >
        <p className="text-slate-500 dark:text-slate-400 text-lg">اسحب وأفلت ملف PDF أو نصي هنا للفتح</p>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-xl">لا توجد مستندات بعد.</p>
          <button onClick={onNewDocument} className="text-primary-600 hover:text-primary-700 font-semibold text-lg">ابدأ بإنشاء أول مستند لك</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {documents.map(doc => (
            <div 
              key={doc.id} 
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary-400 transition-all cursor-pointer group" 
              onClick={() => onSelect(doc.id)}
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 truncate group-hover:text-primary-600">{doc.title || 'مستند بدون عنوان'}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">انقر للفتح والتعديل</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
