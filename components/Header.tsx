import React, { useRef } from 'react';
import { Button } from './ui/button';
import { 
  PlusIcon, FileUpIcon, SearchIcon, ShareIcon, MessageSquareIcon, PrinterIcon, 
  DownloadIcon, FileTextIcon, FolderOpenIcon, SaveIcon
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';

interface HeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  onNewDocument: () => void;
  onOpenDocument: (file: File) => void;
  onExportWord: () => void;
  onExportPdf: () => void;
  onSave: () => void;
  onSaveJoed: () => void;
  onPrint: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title, onTitleChange, onNewDocument, onOpenDocument, onExportWord, onExportPdf, onSave, onSaveJoed, onPrint
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenDocument(file);
    }
    // reset input value so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 h-14 flex items-center px-4 sm:px-6 justify-between w-full backdrop-blur-md transition-colors duration-200">
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
            onChange={(e) => {
              if (typeof onTitleChange === 'function') {
                onTitleChange(e.target.value);
              }
            }}
            className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent border-none focus:ring-0 w-32 sm:w-64 focus:bg-white dark:focus:bg-slate-800 rounded px-2 py-1 transition-all outline-none"
            placeholder="مستند بدون عنوان"
          />
          <div className="hidden sm:block w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />
          
          <button 
            onClick={handleOpenFileClick} 
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-primary-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md px-2 py-1 transition-colors flex items-center gap-1.5" 
            title="فتح مستند (.joed, .docx, .pdf, .txt, .html)"
          >
            <FolderOpenIcon className="w-4 h-4 text-primary-600" />
            <span className="hidden sm:inline">فتح ملف</span>
          </button>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".joed,.docx,.pdf,.txt,.html,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/json" 
            className="hidden" 
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 no-print">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Quick JOED Save */}
          <Button 
            variant="default" 
            size="sm" 
            onClick={onSaveJoed}
            title="حفظ المستند بصيغة Joe Word الأصلية (.joed) مع كافة الأشكال"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 h-8 rounded-full shadow-sm text-xs font-bold"
          >
            <SaveIcon className="w-3.5 h-3.5 text-white" />
            <span>حفظ JOED</span>
          </Button>

          {/* Quick Word Export */}
          <Button 
            variant="default" 
            size="sm" 
            onClick={onExportWord}
            title="تصدير المستند كـ ملف Microsoft Word (.docx)"
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 h-8 rounded-full shadow-sm text-xs font-bold"
          >
            <FileTextIcon className="w-3.5 h-3.5 text-white" />
            <span className="hidden md:inline">تصدير</span>
            <span>Word (.docx)</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={onPrint}
            title="طباعة أو حفظ كـ PDF فوري"
            className="gap-1.5 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 h-8 rounded-full shadow-xs"
          >
            <PrinterIcon className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span className="text-xs font-semibold">طباعة / PDF</span>
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
