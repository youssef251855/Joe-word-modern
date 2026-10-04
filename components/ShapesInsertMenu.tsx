import React from 'react';
import { ShapeType } from '../types/shapes';
import { 
  SquareIcon, CircleIcon, TriangleIcon, StarIcon, ArrowRightIcon,
  MinusIcon, MessageSquareIcon, HexagonIcon, SparklesIcon,
  ChevronDownIcon
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';

interface ShapesInsertMenuProps {
  onInsertShape: (type: ShapeType) => void;
  className?: string;
}

interface ShapeItemDef {
  type: ShapeType;
  name: string;
  category: 'basic' | 'arrows' | 'stars' | 'callouts';
  renderIcon: () => React.ReactNode;
}

const SHAPE_DEFINITIONS: ShapeItemDef[] = [
  // Basic
  {
    type: 'rectangle',
    name: 'مستطيل',
    category: 'basic',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="1" />
      </svg>
    )
  },
  {
    type: 'rounded-rectangle',
    name: 'مستطيل مستدير',
    category: 'basic',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="4" />
      </svg>
    )
  },
  {
    type: 'circle',
    name: 'دائرة',
    category: 'basic',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  },
  {
    type: 'ellipse',
    name: 'شكل بيضاوي',
    category: 'basic',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="12" rx="10" ry="6" />
      </svg>
    )
  },
  {
    type: 'triangle',
    name: 'مثلث',
    category: 'basic',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,3 22,21 2,21" />
      </svg>
    )
  },
  {
    type: 'diamond',
    name: 'معين (Diamond)',
    category: 'basic',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,2 22,12 12,22 2,12" />
      </svg>
    )
  },
  {
    type: 'pentagon',
    name: 'خماسي الأضلاع',
    category: 'basic',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,2 22,9 18,22 6,22 2,9" />
      </svg>
    )
  },
  {
    type: 'hexagon',
    name: 'سداسي الأضلاع',
    category: 'basic',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="6,3 18,3 23,12 18,21 6,21 1,12" />
      </svg>
    )
  },

  // Arrows
  {
    type: 'arrow',
    name: 'سهم لليمين',
    category: 'arrows',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2,9 L14,9 L14,4 L22,12 L14,20 L14,15 L2,15 Z" />
      </svg>
    )
  },
  {
    type: 'arrow-left',
    name: 'سهم لليسار',
    category: 'arrows',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22,9 L10,9 L10,4 L2,12 L10,20 L10,15 L22,15 Z" />
      </svg>
    )
  },
  {
    type: 'double-arrow',
    name: 'سهم مزدوج',
    category: 'arrows',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7,9 L17,9 L17,4 L23,12 L17,20 L17,15 L7,15 L7,20 L1,12 L7,4 Z" />
      </svg>
    )
  },
  {
    type: 'line',
    name: 'خط مستقيم',
    category: 'arrows',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    )
  },

  // Stars
  {
    type: 'star',
    name: 'نجمة خماسية',
    category: 'stars',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
      </svg>
    )
  },

  // Callouts
  {
    type: 'callout',
    name: 'مربع تعليق (Callout)',
    category: 'callouts',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 4h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      </svg>
    )
  },
  {
    type: 'speech-bubble',
    name: 'فقاعة محادثة بيضاوية',
    category: 'callouts',
    renderIcon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3c5.5 0 10 3.6 10 8s-4.5 8-10 8c-1.3 0-2.5-.2-3.6-.6L3 21l1.4-3.8C3 15.5 2 13.8 2 11c0-4.4 4.5-8 10-8z" />
      </svg>
    )
  }
];

export const ShapesInsertMenu: React.FC<ShapesInsertMenuProps> = ({ onInsertShape, className }) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (type: ShapeType) => {
    onInsertShape(type);
    setOpen(false);
  };

  const basicShapes = SHAPE_DEFINITIONS.filter(s => s.category === 'basic');
  const arrowShapes = SHAPE_DEFINITIONS.filter(s => s.category === 'arrows');
  const starShapes = SHAPE_DEFINITIONS.filter(s => s.category === 'stars');
  const calloutShapes = SHAPE_DEFINITIONS.filter(s => s.category === 'callouts');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex flex-col h-[70px] w-[60px] p-0 items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md cursor-pointer border-0 bg-transparent"
        title="إدراج أشكال ومخططات هندسية"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="8" cy="8" r="5" />
            <rect x="11" y="11" width="10" height="10" rx="1" />
          </svg>
        </div>
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] dark:text-slate-300 font-medium">أشكال</span>
          <ChevronDownIcon className="w-2.5 h-2.5 text-slate-400" />
        </div>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-3 bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 rounded-xl"
        align="start"
        dir="rtl"
      >
        <div className="flex items-center justify-between border-b pb-2 mb-3 dark:border-slate-700">
          <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            📐 معرض الأشكال والمخططات (Shapes)
          </span>
          <span className="text-[10px] text-slate-400">14 شكل هندسي</span>
        </div>

        <div className="space-y-3 max-h-[380px] overflow-y-auto pl-1">
          {/* Basic Shapes */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              الأشكال الأساسية:
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {basicShapes.map(s => (
                <button
                  key={s.type}
                  onClick={() => handleSelect(s.type)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/40 text-slate-700 dark:text-slate-200 transition-all group"
                  title={s.name}
                >
                  <div className="group-hover:scale-110 transition-transform text-primary-600 dark:text-primary-400">
                    {s.renderIcon()}
                  </div>
                  <span className="text-[9px] mt-1 truncate max-w-full text-center">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Arrows */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              الأسهم والخطوط:
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {arrowShapes.map(s => (
                <button
                  key={s.type}
                  onClick={() => handleSelect(s.type)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/40 text-slate-700 dark:text-slate-200 transition-all group"
                  title={s.name}
                >
                  <div className="group-hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400">
                    {s.renderIcon()}
                  </div>
                  <span className="text-[9px] mt-1 truncate max-w-full text-center">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stars & Badges */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              النجوم والشارات:
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {starShapes.map(s => (
                <button
                  key={s.type}
                  onClick={() => handleSelect(s.type)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/40 text-slate-700 dark:text-slate-200 transition-all group"
                  title={s.name}
                >
                  <div className="group-hover:scale-110 transition-transform text-amber-500">
                    {s.renderIcon()}
                  </div>
                  <span className="text-[9px] mt-1 truncate max-w-full text-center">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Callouts & Speech Bubbles */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              فقاعات المحادثة والملاحظات:
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {calloutShapes.map(s => (
                <button
                  key={s.type}
                  onClick={() => handleSelect(s.type)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/40 text-slate-700 dark:text-slate-200 transition-all group"
                  title={s.name}
                >
                  <div className="group-hover:scale-110 transition-transform text-emerald-600 dark:text-emerald-400">
                    {s.renderIcon()}
                  </div>
                  <span className="text-[9px] mt-1 truncate max-w-full text-center">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShapesInsertMenu;
