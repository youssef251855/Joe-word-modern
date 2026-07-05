import fs from 'fs';

let content = fs.readFileSync('components/Ribbon.tsx', 'utf-8');

// Fix duplicates
content = content.replace(/dark:hover:bg-slate-700 transition-colors rounded-md dark:hover:bg-slate-700 rounded-lg transition-colors/g, 'dark:hover:bg-slate-700 rounded-lg transition-colors');
content = content.replace(/dark:text-slate-300 dark:text-slate-300/g, 'dark:text-slate-300');
content = content.replace(/text-\[9px\] text-slate-400 dark:text-slate-500 mb-1 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-auto uppercase tracking-wider mb-1/g, 'text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-auto mb-1');
content = content.replace(/hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md dark:hover:bg-slate-700 transition-colors rounded-md/g, 'hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-md');

fs.writeFileSync('components/Ribbon.tsx', content);
console.log("Cleanup complete.");
