import fs from 'fs';

let content = fs.readFileSync('components/Ribbon.tsx', 'utf-8');

// select boxes
content = content.replace(/bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-200/g, 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm rounded-md transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 outline-none focus:ring-1 focus:ring-primary-500');

fs.writeFileSync('components/Ribbon.tsx', content);
console.log("Cleanup selects.");
