import fs from 'fs';

let content = fs.readFileSync('components/Ribbon.tsx', 'utf-8');

content = content.replace(/border-r border-slate-200/g, 'border-l border-slate-200 dark:border-slate-700');
content = content.replace(/hover:bg-slate-100/g, 'hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md');
content = content.replace(/text-slate-600/g, 'text-slate-600 dark:text-slate-300');
content = content.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400');
content = content.replace(/text-slate-400/g, 'text-slate-400 dark:text-slate-500');
content = content.replace(/text-\[10px\]/g, 'text-[10px] dark:text-slate-300');
content = content.replace(/text-\[9px\] text-slate-400/g, 'text-[9px] text-slate-400 dark:text-slate-500 mb-1');
content = content.replace(/h-20 w-16/g, 'h-[70px] w-[60px]');
content = content.replace(/h-20 w-14/g, 'h-[70px] w-[56px]');
content = content.replace(/h-20 w-12/g, 'h-[70px] w-[48px]');
content = content.replace(/h-20 w-20/g, 'h-[70px] w-[80px]');

fs.writeFileSync('components/Ribbon.tsx', content);
console.log("Updated Ribbon.tsx styles.");
