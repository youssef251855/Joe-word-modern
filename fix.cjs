const fs = require('fs');
let code = fs.readFileSync('components/AIAssistant.tsx', 'utf8');

// Find the index of the first `import { BotIcon` which starts Part C.
// Wait, Part A also has `import { BotIcon` on line 2!
// So the file has TWO `import { BotIcon`.
let firstImport = code.indexOf("import { BotIcon");
let secondImport = code.indexOf("import { BotIcon", firstImport + 1);

console.log("firstImport:", firstImport);
console.log("secondImport:", secondImport);

if (secondImport !== -1) {
    // The original file is just `import React...` + everything from secondImport.
    let originalFile = "import React, { useState } from 'react';\n" + code.substring(secondImport);
    fs.writeFileSync('components/AIAssistant.tsx', originalFile);
    console.log("Restored original file!");
} else {
    console.log("Could not find the duplicate import.");
}
