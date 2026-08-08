const fs = require('fs');
let code = fs.readFileSync('components/AIAssistant.tsx', 'utf8');

// The bad line has \`\nملاحظات إضافية: ${bookNotes}\` 
// I need to change it back to `\nملاحظات إضافية: ${bookNotes}`
code = code.replace(/\\\`\\nملاحظات إضافية: \$\{bookNotes\}\\\`/g, "\`\\nملاحظات إضافية: \${bookNotes}\`");

// Also check for the other error. 
code = code.replace(/\\\`\\\`\\\`/g, "\`\`\`"); // I escaped backticks in "(\`\`\`)" -> it generated (\`\`\`) in the typescript file which is invalid.

fs.writeFileSync('components/AIAssistant.tsx', code);
