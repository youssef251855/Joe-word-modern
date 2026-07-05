
import React, { useRef } from 'react';
import { Button } from './ui/button';
import { 
  PlusIcon, FileUpIcon, SearchIcon, ShareIcon, MessageSquareIcon 
} from 'lucide-react';

interface HeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  onNewDocument: () => void;
  onOpenDocument: (file: File) => void;
  onExportPdf: () => void;
  onSave: () => void;
  onPrint: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title, onTitleChange, onNewDocument, onOpenDocument, onExportPdf, onSave, onPrint
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenPdfClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenDocument(file);
    }
  };

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 h-14 flex items-center px-4 sm:px-6 justify-between sticky top-0 z-50 backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-2 sm:gap-6">
        <div className="flex items-center gap-2">
          <div className="text-primary-600 dark:text-primary-500 bg-primary-50 dark:bg-primary-900/30 p-1.5 rounded-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h1 className="hidden sm:block text-xl font-bold text-slate-800 dark:text-white tracking-tight">Joe <span className="font-extrabold text-primary-600 dark:text-primary-500">Word</span></h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-md px-2 py-1 border border-slate-200 dark:border-slate-700">
          <input 
            type="text" 
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent border-none focus:ring-0 w-32 sm:w-64 focus:bg-white dark:focus:bg-slate-800 rounded px-2 py-1 transition-all outline-none"
            placeholder="مستند بدون عنوان"
          />
          <div className="hidden sm:block w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />
          <button onClick={handleOpenPdfClick} className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md px-2 py-1 transition-colors flex items-center gap-1.5" title="فتح مستند">
            <FileUpIcon className="w-4 h-4" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf,.txt,.html" 
            className="hidden" 
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 hidden sm:flex h-8 rounded-full">
            <ShareIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">مشاركة</span>
          </Button>
          
          <div className="flex items-center gap-3 ml-2 border-r border-slate-200 dark:border-slate-700 pr-4">
            <span className="hidden md:inline text-sm font-semibold text-slate-700 dark:text-slate-200">Joe Al</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-white dark:ring-slate-900 cursor-pointer hover:opacity-90 transition-opacity">
              JA
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
