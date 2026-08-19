const fs = require('fs');
let code = fs.readFileSync('components/Editor.tsx', 'utf8');

code = code.replace(/color:\s*#000000\s*!important;/g, "/* color removed */");

fs.writeFileSync('components/Editor.tsx', code);
console.log('Removed black color overriding in Editor');
