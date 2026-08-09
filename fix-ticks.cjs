const fs = require('fs');
let code = fs.readFileSync('components/AIAssistant.tsx', 'utf8');

code = code.replace(/\\\`\\nملاحظات إضافية/g, "\`\\nملاحظات إضافية");

fs.writeFileSync('components/AIAssistant.tsx', code);
