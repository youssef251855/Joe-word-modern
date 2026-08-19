import React from 'react';
import { 
  GlobeIcon, CheckCircle2Icon, 
  FocusIcon, BookOpenIcon, LayoutIcon, Globe2Icon, MinusIcon, PlusIcon 
} from 'lucide-react';
import { Slider } from './ui/slider';
import AdsterraBanner from './AdsterraBanner';

interface StatusBarProps {
  wordCount: number;
  activePage: number;
  totalPages: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ wordCount, activePage, totalPages }) => {
  return (
    <div className="h-14 bg-[#f3f2f1] dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 text-[11px] text-slate-600 dark:text-slate-400 select-none transition-colors duration-200">
      {/* Left section: Stats */}
      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-800 px-2 h-full cursor-pointer transition-colors">
          <span>الصفحة {activePage} من {totalPages}</span>
        </div>
        <div className="flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-800 px-2 h-full cursor-pointer transition-colors">
          <span>{wordCount} كلمة</span>
        </div>
        <div className="hidden md:flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-800 px-2 h-full cursor-pointer transition-colors">
          <GlobeIcon className="w-3 h-3" />
          <span>العربية (مصر)</span>
        </div>
        <div className="hidden lg:flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-800 px-2 h-full cursor-pointer transition-colors">
          <CheckCircle2Icon className="w-3 h-3 text-green-600" />
          <span>إمكانية الوصول: جاهز</span>
        </div>
      </div>

      {/* Middle section: Adsterra Banner Ads */}
      <div className="flex items-center justify-center max-w-[320px] md:max-w-md w-full h-full py-0.5 mx-2">
        <AdsterraBanner className="w-full h-[46px]" />
      </div>

      {/* Right section: Layout Controls */}
      <div className="flex items-center gap-3 h-full">
        <div className="hidden sm:flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-800 px-2 h-full cursor-pointer transition-colors">
          <FocusIcon className="w-3.5 h-3.5" />
          <span>التركيز</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors"><BookOpenIcon className="w-3.5 h-3.5" /></div>
          <div className="p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded cursor-pointer shadow-sm"><LayoutIcon className="w-3.5 h-3.5 text-primary-600" /></div>
          <div className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors"><Globe2Icon className="w-3.5 h-3.5" /></div>
        </div>
        <div className="hidden sm:flex items-center gap-2 ml-2">
          <MinusIcon className="w-3 h-3 cursor-pointer hover:text-slate-900 dark:hover:text-white" />
          <div className="w-20">
            <Slider defaultValue={[100]} max={200} step={1} className="h-1" />
          </div>
          <PlusIcon className="w-3 h-3 cursor-pointer hover:text-slate-900 dark:hover:text-white" />
          <span className="w-8 text-right">100%</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
