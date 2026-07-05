import React from 'react';
import { 
  GlobeIcon, CheckCircle2Icon, 
  FocusIcon, BookOpenIcon, LayoutIcon, Globe2Icon, MinusIcon, PlusIcon 
} from 'lucide-react';
import { Slider } from './ui/slider';

interface StatusBarProps {
  wordCount: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ wordCount }) => {
  return (
    <div className="h-8 bg-[#f3f2f1] border-t border-slate-200 flex items-center justify-between px-4 text-[11px] text-slate-600 select-none">
      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-1 hover:bg-slate-200 px-2 h-full cursor-pointer">
          <span>Page 1 of 1</span>
        </div>
        <div className="flex items-center gap-1 hover:bg-slate-200 px-2 h-full cursor-pointer">
          <span>{wordCount} words</span>
        </div>
        <div className="flex items-center gap-1 hover:bg-slate-200 px-2 h-full cursor-pointer">
          <GlobeIcon className="w-3 h-3" />
          <span>English (United States)</span>
        </div>
        <div className="flex items-center gap-1 hover:bg-slate-200 px-2 h-full cursor-pointer">
          <CheckCircle2Icon className="w-3 h-3 text-green-600" />
          <span>Accessibility: Good to go</span>
        </div>
      </div>

      <div className="flex items-center gap-3 h-full">
        <div className="flex items-center gap-1 hover:bg-slate-200 px-2 h-full cursor-pointer">
          <FocusIcon className="w-3.5 h-3.5" />
          <span>Focus</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="p-1 hover:bg-slate-200 rounded cursor-pointer"><BookOpenIcon className="w-3.5 h-3.5" /></div>
          <div className="p-1 bg-white border border-slate-300 rounded cursor-pointer shadow-sm"><LayoutIcon className="w-3.5 h-3.5 text-primary-600" /></div>
          <div className="p-1 hover:bg-slate-200 rounded cursor-pointer"><Globe2Icon className="w-3.5 h-3.5" /></div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <MinusIcon className="w-3 h-3 cursor-pointer hover:text-slate-900" />
          <div className="w-24">
            <Slider defaultValue={[100]} max={200} step={1} className="h-1" />
          </div>
          <PlusIcon className="w-3 h-3 cursor-pointer hover:text-slate-900" />
          <span className="w-8 text-right">100%</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
