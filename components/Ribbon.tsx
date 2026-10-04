import React, { useRef } from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { 
  ClipboardIcon, ScissorsIcon, CopyIcon, BoldIcon, ItalicIcon, 
  UnderlineIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, 
  AlignJustifyIcon, ListIcon, ListOrderedIcon, ChevronDownIcon,
  SearchIcon, ReplaceIcon, HighlighterIcon,
  FileTextIcon, SaveIcon, PrinterIcon, DownloadIcon,
  ImageIcon, TableIcon, LinkIcon, TypeIcon,
  Heading1Icon, Heading2Icon, Heading3Icon,
  Undo2Icon, Redo2Icon, EraserIcon,
  Strikethrough, Subscript, Superscript,
  LayoutIcon, ColumnsIcon, MaximizeIcon,
  BookOpenIcon, BookmarkIcon,
  CheckCircleIcon, MessageSquareIcon,
  HelpCircleIcon, GlobeIcon, SettingsIcon,
  LanguagesIcon, SpellCheckIcon, FileDigitIcon,
  FileSignatureIcon, QuoteIcon, FootprintsIcon,
  HistoryIcon, EyeIcon, LayoutTemplateIcon,
  RulerIcon, Grid3X3Icon, PanelLeftIcon,
  MicIcon, MicOffIcon, SparklesIcon,
  FolderOpenIcon, Share2Icon, CodeIcon, FileCodeIcon
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { PageBreakIcon } from './icons';
import { ShapeType } from '../types/shapes';
import ShapesInsertMenu from './ShapesInsertMenu';

interface RibbonProps {
  onSave?: () => void;
  onSaveJoed?: () => void;
  onOpenDocx?: () => void;
  onOpenJoed?: () => void;
  onPrint?: () => void;
  onExportWord?: () => void;
  onExportPdf?: () => void;
  onExportTxt?: () => void;
  onExportHtml?: () => void;
  onExportMarkdown?: () => void;
  onInsertShape?: (type: ShapeType) => void;
  onDictate?: () => void;
  isDictating?: boolean;
  onNewDocument?: () => void;
  onFormat?: (name: string, value: any) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  wordCount?: number;
  onShowStats?: () => void;
  onToggleAIAssistant?: () => void;
}

const Ribbon: React.FC<RibbonProps> = ({ 
  onSave, 
  onSaveJoed,
  onOpenDocx,
  onOpenJoed,
  onPrint, 
  onExportWord, 
  onExportPdf, 
  onExportTxt, 
  onExportHtml,
  onExportMarkdown,
  onInsertShape,
  onDictate, 
  isDictating = false, 
  onNewDocument, 
  onFormat, 
  onUndo, 
  onRedo, 
  wordCount = 0, 
  onShowStats, 
  onToggleAIAssistant
}) => {
  return (
    <div className="bg-slate-50/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 select-none backdrop-blur-sm transition-colors duration-200">
      <Tabs defaultValue="home" className="w-full">
        <div className="px-2 pt-1 w-full flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto scrollbar-none">
            <TabsList className="bg-transparent h-9 p-0 gap-2 flex min-w-max">
              <TabsTrigger value="file" className="px-4 h-9 rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-none text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md dark:hover:bg-slate-800/50">ملف</TabsTrigger>
              <TabsTrigger value="home" className="px-4 h-9 rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-none text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md dark:hover:bg-slate-800/50">الصفحة الرئيسية</TabsTrigger>
              <TabsTrigger value="insert" className="px-4 h-9 rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-none text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md dark:hover:bg-slate-800/50">إدراج (Shapes & Objects)</TabsTrigger>
              <TabsTrigger value="layout" className="px-4 h-9 rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-none text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md dark:hover:bg-slate-800/50">تخطيط</TabsTrigger>
              <TabsTrigger value="view" className="px-4 h-9 rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-none text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md dark:hover:bg-slate-800/50">عرض</TabsTrigger>
              <TabsTrigger value="references" className="px-4 h-9 rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-none text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md dark:hover:bg-slate-800/50">مراجع</TabsTrigger>
              <TabsTrigger value="review" className="px-4 h-9 rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-none text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md dark:hover:bg-slate-800/50">مراجعة</TabsTrigger>
              <TabsTrigger value="help" className="px-4 h-9 rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-none text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md dark:hover:bg-slate-800/50">مساعدة</TabsTrigger>
            </TabsList>
          </div>
          <button 
            onClick={onToggleAIAssistant}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm shrink-0 mb-1"
          >
            <SparklesIcon className="w-4 h-4" />
            <span className="hidden sm:inline">المساعد الذكي</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 h-28 flex items-center px-2 overflow-x-auto scrollbar-none transition-colors duration-200">
          {/* FILE TAB */}
          <TabsContent value="file" className="m-0 h-full flex items-center gap-0 min-w-max">
            {/* Core Management */}
            <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-3 py-1 shrink-0">
              <div className="flex-1 flex items-center gap-1.5">
                <Button variant="ghost" onClick={() => onFormat?.('dashboard', true)} className="flex flex-col h-[70px] w-14 p-0 gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <LayoutIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                  <span className="text-[10px] dark:text-slate-300 font-medium tracking-wide">لوحة التحكم</span>
                </Button>
                <div className="w-[1px] h-10 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
                <Button variant="ghost" onClick={onNewDocument} className="flex flex-col h-[70px] w-14 p-0 gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <FileTextIcon className="w-6 h-6 text-primary-500" />
                  <span className="text-[10px] dark:text-slate-300 font-medium tracking-wide">جديد</span>
                </Button>
                <Button variant="ghost" onClick={onSave} className="flex flex-col h-[70px] w-14 p-0 gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="حفظ المستند الحالي بصيغة JOED">
                  <SaveIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  <span className="text-[10px] dark:text-slate-300 font-medium tracking-wide">حفظ</span>
                </Button>
                <Button variant="ghost" onClick={onSaveJoed} className="flex flex-col h-[70px] w-20 p-0 gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors" title="حفظ وتنزيل المستند بالصيغة الأصلية (.joed)">
                  <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                    JD
                  </div>
                  <span className="text-[10px] font-bold tracking-wide">حفظ كـ JOED</span>
                </Button>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-auto mb-1">المستند و JOED</span>
            </div>

            {/* Open Formats Group */}
            <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-3 py-1 shrink-0">
              <div className="flex-1 flex items-center gap-1.5">
                <Button variant="ghost" onClick={onOpenDocx} className="flex flex-col h-[70px] w-20 p-0 gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg transition-colors" title="فتح وقراءة ملف Microsoft Word (.docx)">
                  <FolderOpenIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-[10px] font-bold tracking-wide">Open DOCX</span>
                </Button>
                <Button variant="ghost" onClick={onOpenJoed} className="flex flex-col h-[70px] w-20 p-0 gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors" title="فتح واستعادة مستند JOED أصلي (.joed)">
                  <FolderOpenIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] font-bold tracking-wide">Open JOED</span>
                </Button>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-auto mb-1">فتح الملفات</span>
            </div>

            {/* Export Menu Group */}
            <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-3 py-1 shrink-0">
              <div className="flex-1 flex items-center gap-1.5">
                {/* File -> Export Menu Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex flex-col h-[70px] w-20 p-0 items-center justify-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg transition-colors cursor-pointer border-0 bg-transparent">
                    <DownloadIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <div className="flex items-center gap-0.5">
                      <span className="text-[10px] font-bold tracking-wide">File → Export</span>
                      <ChevronDownIcon className="w-3 h-3" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 p-1.5 bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 text-right" dir="rtl">
                    <DropdownMenuItem onClick={onSaveJoed} className="cursor-pointer gap-2 py-2">
                      <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black">JD</div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100">JOED (.joed)</div>
                        <div className="text-[10px] text-slate-500">صيغة Joe Word الأصلية الكاملة مع الأشكال</div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onExportWord} className="cursor-pointer gap-2 py-2">
                      <FileTextIcon className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100">Word DOCX (.docx)</div>
                        <div className="text-[10px] text-slate-500">مستند Microsoft Word متوافق</div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportPdf} className="cursor-pointer gap-2 py-2">
                      <DownloadIcon className="w-5 h-5 text-rose-500" />
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100">PDF (.pdf)</div>
                        <div className="text-[10px] text-slate-500">مستند PDF قابل للطباعة والمشاركة</div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportHtml} className="cursor-pointer gap-2 py-2">
                      <CodeIcon className="w-5 h-5 text-amber-500" />
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100">HTML (.html)</div>
                        <div className="text-[10px] text-slate-500">صفحة ويب مستقلة مدمجة الأشكال</div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportTxt} className="cursor-pointer gap-2 py-2">
                      <FileTextIcon className="w-5 h-5 text-slate-500" />
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100">Plain TXT (.txt)</div>
                        <div className="text-[10px] text-slate-500">نص خام مجرد بدون تنسيق</div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportMarkdown} className="cursor-pointer gap-2 py-2">
                      <FileCodeIcon className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100">Markdown (.md)</div>
                        <div className="text-[10px] text-slate-500">تنسيق ماركداون مع بيانات الأشكال</div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" onClick={onExportWord} className="flex flex-col h-[70px] w-18 p-0 gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg transition-colors" title="تصدير سريع لـ Word">
                  <FileTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-[10px] font-bold tracking-wide">DOCX</span>
                </Button>

                <Button variant="ghost" onClick={onPrint} className="flex flex-col h-[70px] w-18 p-0 gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg transition-colors" title="طباعة أو تصدير PDF بجودة عالية">
                  <PrinterIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[10px] font-semibold tracking-wide">طباعة / PDF</span>
                </Button>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-auto mb-1">التصدير والطباعة</span>
            </div>
          </TabsContent>

          {/* HOME TAB */}
          <TabsContent value="home" className="m-0 h-full flex items-center gap-0 min-w-max">
            {/* Clipboard Group */}
            <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-2 py-1 shrink-0">
              <div className="flex-1 flex items-center gap-2">
                <Button variant="ghost" className="flex flex-col h-[70px] w-[56px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                  <ClipboardIcon className="w-8 h-8 text-primary-600" />
                  <span className="text-[10px] dark:text-slate-300">لصق</span>
                </Button>
                <div className="flex flex-col gap-0 justify-center">
                  <Button variant="ghost" size="sm" onClick={onUndo} className="h-6 px-2 justify-start gap-2 text-[10px] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <Undo2Icon className="w-3.5 h-3.5" /> تراجع
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onRedo} className="h-6 px-2 justify-start gap-2 text-[10px] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <Redo2Icon className="w-3.5 h-3.5" /> إعادة
                  </Button>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-1 dark:text-slate-500 mt-auto uppercase tracking-wider">الحافظة</span>
            </div>

            {/* Font Group */}
            <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-2 py-1 shrink-0">
              <div className="flex-1 flex flex-col gap-1 justify-center">
                <div className="flex items-center gap-1">
                  <Select onValueChange={(val) => onFormat?.('font', val)}>
                    <SelectTrigger className="h-7 w-32 text-[11px] bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Calibri" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans-serif">Sans Serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="monospace">Monospace</SelectItem>
                      <SelectItem value="arial">Arial</SelectItem>
                      <SelectItem value="georgia">Georgia</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(val) => onFormat?.('size', val)}>
                    <SelectTrigger className="h-7 w-16 text-[11px] bg-slate-50 border-slate-200">
                      <SelectValue placeholder="11" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">صغير</SelectItem>
                      <SelectItem value="normal">عادي</SelectItem>
                      <SelectItem value="large">كبير</SelectItem>
                      <SelectItem value="huge">ضخم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('bold', true)} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><BoldIcon className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('italic', true)} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><ItalicIcon className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('underline', true)} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><UnderlineIcon className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('strike', true)} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><Strikethrough className="w-4 h-4" /></Button>
                  <div className="w-px h-5 bg-slate-200 mx-1" />
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('script', 'sub')} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><Subscript className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('script', 'super')} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><Superscript className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('color', '#ef4444')} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><TypeIcon className="w-4 h-4 text-red-500" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('background', '#fef08a')} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><HighlighterIcon className="w-4 h-4 text-yellow-500" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('clean', true)} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><EraserIcon className="w-4 h-4 text-slate-500" /></Button>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-1 dark:text-slate-500 mt-auto uppercase tracking-wider">خط</span>
            </div>

            {/* Paragraph Group */}
            <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-2 py-1 shrink-0">
              <div className="flex-1 flex flex-col gap-1 justify-center">
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('list', 'bullet')} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><ListIcon className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('list', 'ordered')} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><ListOrderedIcon className="w-4 h-4" /></Button>
                  <div className="w-px h-5 bg-slate-200 mx-1" />
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('align', 'left')} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><AlignLeftIcon className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('align', 'center')} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><AlignCenterIcon className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('align', 'right')} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><AlignRightIcon className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('align', 'justify')} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><AlignJustifyIcon className="w-4 h-4" /></Button>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('header', 1)} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><Heading1Icon className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('header', 2)} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><Heading2Icon className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onFormat?.('header', 3)} className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md"><Heading3Icon className="w-4 h-4" /></Button>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-1 dark:text-slate-500 mt-auto uppercase tracking-wider">فقرة</span>
            </div>

            {/* Editing Group */}
            <div className="flex flex-col items-center h-full px-2 py-1 shrink-0">
              <div className="flex-1 flex flex-col gap-0 justify-center">
                <Button variant="ghost" size="sm" className="h-6 px-2 justify-start gap-2 text-[10px] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                  <SearchIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> بحث
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 justify-start gap-2 text-[10px] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                  <ReplaceIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> استبدال
                </Button>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-1 mt-auto uppercase tracking-wider">تحرير</span>
            </div>

            {/* Voice Group */}
            <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-2 py-1 shrink-0">
              <div className="flex-1 flex items-center gap-1">
                <Button variant="ghost" onClick={onDictate} className={cn("flex flex-col h-[70px] w-[56px] p-0 gap-1 rounded-md transition-colors", isDictating ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600" : "hover:bg-slate-100 dark:hover:bg-slate-700")}>
                  {isDictating ? <MicOffIcon className="w-8 h-8 text-rose-600 animate-pulse" /> : <MicIcon className="w-8 h-8 text-primary-600" />}
                  <span className="text-[10px] dark:text-slate-300">إملاء</span>
                </Button>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-1 mt-auto uppercase tracking-wider">صوت</span>
            </div>

          </TabsContent>

          {/* INSERT TAB */}
          <TabsContent value="insert" className="m-0 h-full flex items-center gap-0 min-w-max">
             {/* Shapes Section (NEW & ADVANCED) */}
             <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-3 py-1 shrink-0 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-lg">
                <div className="flex-1 flex items-center gap-2">
                  {onInsertShape && (
                    <ShapesInsertMenu onInsertShape={onInsertShape} />
                  )}
                </div>
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold mb-1 mt-auto uppercase tracking-wider">الأشكال والمخططات</span>
             </div>

             {/* Standard Inserts */}
             <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-2 py-1 shrink-0">
                <div className="flex-1 flex items-center gap-2">
                  <Button variant="ghost" onClick={() => onFormat?.('pageBreak', true)} className="flex flex-col h-[70px] w-[60px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <PageBreakIcon className="w-8 h-8 text-primary-600" />
                    <span className="text-[10px] dark:text-slate-300">فاصل صفحات</span>
                  </Button>
                  <Button variant="ghost" onClick={() => onFormat?.('image', true)} className="flex flex-col h-[70px] w-[60px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <ImageIcon className="w-8 h-8 text-green-600" />
                    <span className="text-[10px] dark:text-slate-300">صورة</span>
                  </Button>
                  <Button variant="ghost" onClick={() => onFormat?.('table', true)} className="flex flex-col h-[70px] w-[60px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <TableIcon className="w-8 h-8 text-blue-600" />
                    <span className="text-[10px] dark:text-slate-300">جدول</span>
                  </Button>
                  <Button variant="ghost" onClick={() => onFormat?.('link', true)} className="flex flex-col h-[70px] w-[60px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <LinkIcon className="w-8 h-8 text-primary-600" />
                    <span className="text-[10px] dark:text-slate-300">ارتباط</span>
                  </Button>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-1 mt-auto uppercase tracking-wider">وسائط وعناصر</span>
             </div>
          </TabsContent>

          {/* VIEW TAB */}
          <TabsContent value="view" className="m-0 h-full flex items-center gap-0 min-w-max">
             <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-2 py-1 shrink-0">
                <div className="flex-1 flex items-center gap-2">
                  <Button variant="ghost" onClick={() => onFormat?.('toggleNavigation', true)} className="flex flex-col h-[70px] w-[60px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <PanelLeftIcon className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                    <span className="text-[10px] dark:text-slate-300">جزء التنقل</span>
                  </Button>
                  <Button variant="ghost" onClick={() => onFormat?.('toggleReadingView', true)} className="flex flex-col h-[70px] w-[60px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <EyeIcon className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                    <span className="text-[10px] dark:text-slate-300">عرض القراءة</span>
                  </Button>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-1 mt-auto uppercase tracking-wider">طرق العرض</span>
             </div>
             <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-2 py-1 shrink-0">
                <div className="flex-1 flex items-center gap-2">
                  <Button variant="ghost" onClick={() => onFormat?.('toggleRuler', true)} className="flex flex-col h-[70px] w-[48px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <RulerIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    <span className="text-[10px] dark:text-slate-300">المسطرة</span>
                  </Button>
                  <Button variant="ghost" onClick={() => onFormat?.('toggleGrid', true)} className="flex flex-col h-[70px] w-[48px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <Grid3X3Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    <span className="text-[10px] dark:text-slate-300">خطوط الشبكة</span>
                  </Button>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-1 mt-auto uppercase tracking-wider">إظهار</span>
             </div>
          </TabsContent>

          {/* LAYOUT TAB */}
          <TabsContent value="layout" className="m-0 h-full flex items-center gap-0 min-w-max">
             <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-2 py-1 shrink-0">
                <div className="flex-1 flex items-center gap-2">
                  <Select onValueChange={(val) => onFormat?.('margins', val)}>
                    <SelectTrigger className="flex flex-col h-[70px] w-[60px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md border-none shadow-none bg-transparent">
                      <LayoutTemplateIcon className="w-8 h-8 text-primary-600" />
                      <span className="text-[10px] dark:text-slate-300">الهوامش</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">عادي</SelectItem>
                      <SelectItem value="narrow">ضيق</SelectItem>
                      <SelectItem value="wide">عريض</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(val) => onFormat?.('orientation', val)}>
                    <SelectTrigger className="flex flex-col h-[70px] w-[60px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md border-none shadow-none bg-transparent">
                      <MaximizeIcon className="w-8 h-8 text-primary-600" />
                      <span className="text-[10px] dark:text-slate-300">الاتجاه</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">عمودي</SelectItem>
                      <SelectItem value="landscape">أفقي</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" className="flex flex-col h-[70px] w-[60px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <ColumnsIcon className="w-8 h-8 text-primary-600" />
                    <span className="text-[10px] dark:text-slate-300">الأعمدة</span>
                  </Button>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-1 mt-auto uppercase tracking-wider">إعداد الصفحة</span>
             </div>
          </TabsContent>

          {/* REFERENCES TAB */}
          <TabsContent value="references" className="m-0 h-full flex items-center gap-0 min-w-max">
             <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-2 py-1 shrink-0">
                <div className="flex-1 flex items-center gap-2">
                  <Button variant="ghost" className="flex flex-col h-[70px] w-[80px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <BookOpenIcon className="w-8 h-8 text-amber-600" />
                    <span className="text-[10px] dark:text-slate-300">جدول المحتويات</span>
                  </Button>
                  <Button variant="ghost" className="flex flex-col h-[70px] w-[60px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <FootprintsIcon className="w-8 h-8 text-amber-600" />
                    <span className="text-[10px] dark:text-slate-300">إدراج حاشية</span>
                  </Button>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-1 mt-auto uppercase tracking-wider">جدول المحتويات</span>
             </div>
          </TabsContent>

          {/* REVIEW TAB */}
          <TabsContent value="review" className="m-0 h-full flex items-center gap-0 min-w-max">
             <div className="flex flex-col items-center h-full border-l border-slate-200 dark:border-slate-700 px-2 py-1 shrink-0">
                <div className="flex-1 flex items-center gap-2">
                  <Button variant="ghost" className="flex flex-col h-[70px] w-[60px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <SpellCheckIcon className="w-8 h-8 text-blue-600" />
                    <span className="text-[10px] dark:text-slate-300">تدقيق إملائي</span>
                  </Button>
                  <Button variant="ghost" className="flex flex-col h-[70px] w-[60px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <LanguagesIcon className="w-8 h-8 text-blue-600" />
                    <span className="text-[10px] dark:text-slate-300">ترجمة</span>
                  </Button>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-1 mt-auto uppercase tracking-wider">تدقيق</span>
             </div>
          </TabsContent>

          {/* HELP TAB */}
          <TabsContent value="help" className="m-0 h-full flex items-center gap-0 min-w-max">
             <div className="flex flex-col items-center h-full px-2 py-1 shrink-0">
                <div className="flex-1 flex items-center gap-2">
                  <Button variant="ghost" className="flex flex-col h-[70px] w-[60px] p-0 gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md">
                    <HelpCircleIcon className="w-8 h-8 text-purple-600" />
                    <span className="text-[10px] dark:text-slate-300">تعليمات</span>
                  </Button>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-1 mt-auto uppercase tracking-wider">مساعدة</span>
             </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Ribbon;
