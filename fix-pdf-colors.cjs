const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(/color:\s*#000000\s*!important;/g, "/* color removed to keep inline colors */");

fs.writeFileSync('App.tsx', code);
console.log('Removed black color overriding');
