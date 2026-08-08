const fs = require('fs');
let code = fs.readFileSync('components/AIAssistant.tsx', 'utf8');

// Replace \`\nملاحظات إضافية: ${bookNotes}\` with `\nملاحظات إضافية: ${bookNotes}`
code = code.replace(/\\\`\\nملاحظات إضافية: \$\{bookNotes\}\\\`/g, "`\\nملاحظات إضافية: ${bookNotes}`");

// Wait, I should also replace the (\`\`\`) in the prompt.
// Wait, (\`\`\`) is inside the text. Since the string is a template literal, I DO need to escape those backticks!
// So (\`\`\`) is correct for the literal string. Let's make sure it is (\`\`\`).
code = code.replace(/\(\\\`\\\`\\\`\)/g, "(\\`\\`\\`)"); 
code = code.replace(/\(```\)/g, "(\\`\\`\\`)");

fs.writeFileSync('components/AIAssistant.tsx', code);
