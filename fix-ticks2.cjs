const fs = require('fs');
let code = fs.readFileSync('components/AIAssistant.tsx', 'utf8');

code = code.replace(/\}\\\` : ''\}/g, "}` : ''}");

fs.writeFileSync('components/AIAssistant.tsx', code);
