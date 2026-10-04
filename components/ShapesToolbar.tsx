import React from 'react';
import { ShapeItem, BorderStyle } from '../types/shapes';
import { 
  CopyIcon, Trash2Icon, LayersIcon, ArrowUpIcon, ArrowDownIcon,
  ChevronsUpIcon, ChevronsDownIcon, AlignLeftIcon, AlignCenterIcon, 
  AlignRightIcon, BoldIcon, ItalicIcon, SlidersIcon, GroupIcon, UngroupIcon,
  MoveIcon
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface ShapesToolbarProps {
  selectedShapes: ShapeItem[];
  allShapes: ShapeItem[];
  onUpdateShapes: (updated: ShapeItem[]) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onGroupSelected: () => void;
  onUngroupSelected: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#10b981', // green
  '#06b6d4', // cyan
  '#0f172a', // slate dark
  '#64748b', // slate
  '#ffffff', // white
  'transparent'
];

export const ShapesToolbar: React.FC<ShapesToolbarProps> = ({
  selectedShapes,
  allShapes,
  onUpdateShapes,
  onDeleteSelected,
  onDuplicateSelected,
  onGroupSelected,
  onUngroupSelected,
}) => {
  if (selectedShapes.length === 0) return null;

  const firstShape = selectedShapes[0];
  const isMulti = selectedShapes.length > 1;
  const canGroup = isMulti;
  const canUngroup = selectedShapes.some(s => !!s.groupId);

  // Helper to update properties on selected shapes
  const updateSelected = (partial: Partial<ShapeItem>) => {
    const ids = selectedShapes.map(s => s.id);
    const updated = allShapes.map(s => {
      if (ids.includes(s.id)) {
        return { ...s, ...partial };
      }
      return s;
    });
    onUpdateShapes(updated);
  };

  // Helper to update textStyle on selected shapes
  const updateTextStyle = (partial: Partial<NonNullable<ShapeItem['textStyle']>>) => {
    const ids = selectedShapes.map(s => s.id);
    const updated = allShapes.map(s => {
      if (ids.includes(s.id)) {
        const currentStyle = s.textStyle || {
          fontSize: 14,
          fontFamily: 'Cairo',
          color: '#ffffff',
          bold: false,
          italic: false,
          underline: false,
          align: 'center'
        };
        return {
          ...s,
          textStyle: { ...currentStyle, ...partial }
        };
      }
      return s;
    });
    onUpdateShapes(updated);
  };

  // Z-Index / Ordering
  const bringToFront = () => {
    const maxZ = Math.max(...allShapes.map(s => s.zIndex || 1), 1);
    updateSelected({ zIndex: maxZ + 1 });
  };

  const bringForward = () => {
    const ids = selectedShapes.map(s => s.id);
    const updated = allShapes.map(s => {
      if (ids.includes(s.id)) {
        return { ...s, zIndex: (s.zIndex || 1) + 1 };
      }
      return s;
    });
    onUpdateShapes(updated);
  };

  const sendBackward = () => {
    const ids = selectedShapes.map(s => s.id);
    const updated = allShapes.map(s => {
      if (ids.includes(s.id)) {
        return { ...s, zIndex: Math.max(1, (s.zIndex || 1) - 1) };
      }
      return s;
    });
    onUpdateShapes(updated);
  };

  const sendToBack = () => {
    updateSelected({ zIndex: 1 });
  };

  // Alignment
  const alignShapes = (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedShapes.length === 0) return;
    const ids = selectedShapes.map(s => s.id);

    // If multi, align relative to bounding box of selected items
    const minX = Math.min(...selectedShapes.map(s => s.x));
    const maxX = Math.max(...selectedShapes.map(s => s.x + s.width));
    const minY = Math.min(...selectedShapes.map(s => s.y));
    const maxY = Math.max(...selectedShapes.map(s => s.y + s.height));
    const groupW = maxX - minX;
    const groupH = maxY - minY;

    const updated = allShapes.map(s => {
      if (ids.includes(s.id)) {
        switch (direction) {
          case 'left': return { ...s, x: minX };
          case 'center': return { ...s, x: minX + (groupW - s.width) / 2 };
          case 'right': return { ...s, x: maxX - s.width };
          case 'top': return { ...s, y: minY };
          case 'middle': return { ...s, y: minY + (groupH - s.height) / 2 };
          case 'bottom': return { ...s, y: maxY - s.height };
        }
      }
      return s;
    });
    onUpdateShapes(updated);
  };

  return (
    <div 
      className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-1.5 flex items-center flex-wrap gap-1.5 z-40 transition-all text-xs"
      dir="rtl"
    >
      <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200 dark:border-slate-700">
        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 text-[11px]">
          🎨 تنسيق الشكل {isMulti ? `(${selectedShapes.length})` : ''}
        </span>
      </div>

      {/* Fill Color */}
      <Popover>
        <PopoverTrigger 
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
          title="لون التعبئة"
        >
          <div 
            className="w-4 h-4 rounded border border-slate-300 shadow-2xs" 
            style={{ backgroundColor: firstShape.fill === 'transparent' ? '#ffffff' : firstShape.fill }}
          />
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">تعبئة</span>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700" align="start">
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-2">اختر لون التعبئة:</div>
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => updateSelected({ fill: c })}
                className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform relative"
                style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                title={c}
              >
                {c === 'transparent' && <span className="absolute inset-0 text-red-500 font-bold text-xs flex items-center justify-center">✕</span>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t pt-2 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">مخصص:</span>
            <input 
              type="color" 
              value={firstShape.fill === 'transparent' ? '#3b82f6' : firstShape.fill} 
              onChange={(e) => updateSelected({ fill: e.target.value })}
              className="w-8 h-6 p-0 border-0 rounded cursor-pointer" 
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* Stroke / Border Color & Style */}
      <Popover>
        <PopoverTrigger 
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
          title="الحدود والإطار"
        >
          <div 
            className="w-4 h-4 rounded border-2 shadow-2xs" 
            style={{ borderColor: firstShape.stroke }}
          />
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">الحدود</span>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700" align="start">
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">لون الإطار:</span>
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_COLORS.filter(c => c !== 'transparent').map(c => (
                  <button
                    key={c}
                    onClick={() => updateSelected({ stroke: c })}
                    className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                <span>سمك الإطار:</span>
                <span className="font-bold">{firstShape.strokeWidth}px</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="16" 
                value={firstShape.strokeWidth} 
                onChange={(e) => updateSelected({ strokeWidth: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">نمط الإطار:</span>
              <div className="grid grid-cols-3 gap-1">
                {(['solid', 'dashed', 'dotted'] as BorderStyle[]).map(style => (
                  <button
                    key={style}
                    onClick={() => updateSelected({ strokeStyle: style })}
                    className={`px-2 py-1 text-[10px] rounded border ${firstShape.strokeStyle === style ? 'border-primary-500 bg-primary-50 text-primary-700 font-bold' : 'border-slate-200 text-slate-600'}`}
                  >
                    {style === 'solid' ? 'مصمت' : style === 'dashed' ? 'متقطع' : 'منقط'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Opacity Slider */}
      <Popover>
        <PopoverTrigger 
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
          title="الشفافية"
        >
          <SlidersIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{Math.round((firstShape.opacity ?? 1) * 100)}%</span>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2.5 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1.5">
            <span>الشفافية:</span>
            <span className="font-bold">{Math.round((firstShape.opacity ?? 1) * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0.1" 
            max="1" 
            step="0.05"
            value={firstShape.opacity ?? 1} 
            onChange={(e) => updateSelected({ opacity: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </PopoverContent>
      </Popover>

      {/* Text formatting inside shape */}
      <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-slate-700 pr-1 mr-0.5">
        <button
          onClick={() => updateTextStyle({ bold: !(firstShape.textStyle?.bold) })}
          className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${firstShape.textStyle?.bold ? 'bg-slate-200 dark:bg-slate-600 font-bold' : ''}`}
          title="عريض"
        >
          <BoldIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => updateTextStyle({ italic: !(firstShape.textStyle?.italic) })}
          className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${firstShape.textStyle?.italic ? 'bg-slate-200 dark:bg-slate-600' : ''}`}
          title="مائل"
        >
          <ItalicIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => updateTextStyle({ align: 'right' })}
          className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${firstShape.textStyle?.align === 'right' ? 'bg-slate-200 dark:bg-slate-600' : ''}`}
          title="محاذاة يمين"
        >
          <AlignRightIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => updateTextStyle({ align: 'center' })}
          className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${firstShape.textStyle?.align === 'center' ? 'bg-slate-200 dark:bg-slate-600' : ''}`}
          title="محاذاة وسط"
        >
          <AlignCenterIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => updateTextStyle({ align: 'left' })}
          className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${firstShape.textStyle?.align === 'left' ? 'bg-slate-200 dark:bg-slate-600' : ''}`}
          title="محاذاة يسار"
        >
          <AlignLeftIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Z-Index / Arrange Dropdown */}
      <Popover>
        <PopoverTrigger 
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
          title="ترتيب الطبقات"
        >
          <LayersIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">ترتيب</span>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1.5 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700" align="start">
          <button onClick={bringToFront} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors text-right">
            <ChevronsUpIcon className="w-4 h-4 text-primary-600" /> إحضار إلى المقدمة
          </button>
          <button onClick={bringForward} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors text-right">
            <ArrowUpIcon className="w-4 h-4 text-primary-500" /> إحضار للأمام خطوة
          </button>
          <button onClick={sendBackward} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors text-right">
            <ArrowDownIcon className="w-4 h-4 text-slate-500" /> إرسال للخلف خطوة
          </button>
          <button onClick={sendToBack} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors text-right">
            <ChevronsDownIcon className="w-4 h-4 text-slate-600" /> إرسال إلى الخلفية
          </button>
        </PopoverContent>
      </Popover>

      {/* Alignment Dropdown */}
      <Popover>
        <PopoverTrigger 
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
          title="محاذاة"
        >
          <MoveIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">محاذاة</span>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1.5 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700" align="start">
          <button onClick={() => alignShapes('right')} className="w-full flex items-center gap-2 px-2 py-1 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-right">
            محاذاة إلى اليمين
          </button>
          <button onClick={() => alignShapes('center')} className="w-full flex items-center gap-2 px-2 py-1 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-right">
            محاذاة إلى الوسط
          </button>
          <button onClick={() => alignShapes('left')} className="w-full flex items-center gap-2 px-2 py-1 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-right">
            محاذاة إلى اليسار
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
          <button onClick={() => alignShapes('top')} className="w-full flex items-center gap-2 px-2 py-1 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-right">
            محاذاة إلى الأعلى
          </button>
          <button onClick={() => alignShapes('middle')} className="w-full flex items-center gap-2 px-2 py-1 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-right">
            محاذاة إلى المنتصف
          </button>
          <button onClick={() => alignShapes('bottom')} className="w-full flex items-center gap-2 px-2 py-1 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-right">
            محاذاة إلى الأسفل
          </button>
        </PopoverContent>
      </Popover>

      {/* Group / Ungroup */}
      {canGroup && (
        <button
          onClick={onGroupSelected}
          className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors text-[11px] font-semibold"
          title="تجميع الأشكال المحددة"
        >
          <GroupIcon className="w-3.5 h-3.5" />
          <span>تجميع</span>
        </button>
      )}

      {canUngroup && (
        <button
          onClick={onUngroupSelected}
          className="flex items-center gap-1 px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition-colors text-[11px] font-semibold"
          title="فك تجميع الأشكال"
        >
          <UngroupIcon className="w-3.5 h-3.5" />
          <span>فك التجميع</span>
        </button>
      )}

      {/* Duplicate & Delete Actions */}
      <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-1 mr-0.5">
        <button
          onClick={onDuplicateSelected}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          title="مضاعفة (Duplicate)"
        >
          <CopyIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onDeleteSelected}
          className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-colors"
          title="حذف الشكل"
        >
          <Trash2Icon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ShapesToolbar;
