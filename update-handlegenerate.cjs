const fs = require('fs');
let code = fs.readFileSync('components/AIAssistant.tsx', 'utf8');

const oldHandleGenerate = `  const handleGenerate = async (actionPrompt: string, systemInstruction?: string, actionType: 'replace' | 'insert' | 'title' | 'document' = 'replace') => {`;
const newHandleGenerate = `  const handleGenerate = async (actionPrompt: string, systemInstruction?: string, actionType: 'replace' | 'insert' | 'title' | 'document' = 'replace', prefixHtml: string = '') => {`;

const oldSetPreview = `      setPreviewContent(resultText.trim());`;
const newSetPreview = `      setPreviewContent(prefixHtml + resultText.trim());`;

if (code.includes(oldHandleGenerate) && code.includes(oldSetPreview)) {
    code = code.replace(oldHandleGenerate, newHandleGenerate);
    code = code.replace(oldSetPreview, newSetPreview);
    fs.writeFileSync('components/AIAssistant.tsx', code);
    console.log('Updated handleGenerate signature');
} else {
    console.log('Could not find handleGenerate to update');
}
