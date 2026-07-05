import React from 'react';
import { MoonIcon, SunIcon, TrashIcon, PrinterIcon, SaveIcon, FocusIcon, CalendarIcon, DirectionIcon, ThemeIcon, ReadOnlyIcon, HtmlIcon } from './icons';

const EditorHelp: React.FC = () => {
  const helpItems = [
    { icon: <MoonIcon className="w-5 h-5" />, label: 'الوضع الليلي: للتبديل بين الوضع الفاتح والداكن.' },
    { icon: <TrashIcon className="w-5 h-5" />, label: 'صفحة جديدة: لمسح المحتوى والبدء من جديد.' },
    { icon: <PrinterIcon className="w-5 h-5" />, label: 'طباعة: لطباعة المستند.' },
    { icon: <SaveIcon className="w-5 h-5" />, label: 'حفظ كـ نص: لتنزيل المحتوى كملف نصي (.txt).' },
    { icon: <FocusIcon className="w-5 h-5" />, label: 'وضع التركيز: لإخفاء شريط الأدوات للكتابة بدون تشتت.' },
    { icon: <CalendarIcon className="w-5 h-5" />, label: 'إدراج التاريخ: لإدراج التاريخ والوقت الحاليين.' },
    { icon: <DirectionIcon className="w-5 h-5" />, label: 'تبديل الاتجاه: للتبديل بين العربية والإنجليزية.' },
    { icon: <ThemeIcon className="w-5 h-5" />, label: 'تغيير السمة: لتغيير ألوان التطبيق.' },
    { icon: <ReadOnlyIcon className="w-5 h-5" />, label: 'قراءة فقط: لقفل المحرر ومنع التعديل.' },
    { icon: <HtmlIcon className="w-5 h-5" />, label: 'تصدير HTML: لتنزيل المحتوى بتنسيق HTML.' },
  ];

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded shadow-md">
      <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">شرح أزرار المحرر</h2>
      <ul className="space-y-3">
        {helpItems.map((item, index) => (
          <li key={index} className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            {item.icon}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EditorHelp;
