const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const oldCss = `        .export-pdf-container {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        .export-pdf-container, .export-pdf-container * {
          color: #000000 !important;
          background-color: transparent !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;`;

const newCss = `        .export-pdf-container {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        .export-pdf-container, .export-pdf-container * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;`;

if (code.includes(oldCss)) {
    code = code.replace(oldCss, newCss);
    fs.writeFileSync('App.tsx', code);
    console.log('Fixed PDF CSS');
} else {
    console.log('PDF CSS not found!');
}
