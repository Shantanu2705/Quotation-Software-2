const fs = require('fs');
let code = fs.readFileSync('src/components/quotation/QuotationForm.tsx', 'utf8');

// Replace \` with `
code = code.replace(/\\\`/g, '`');

// Replace \$ with $
code = code.replace(/\\\$/g, '$');

fs.writeFileSync('src/components/quotation/QuotationForm.tsx', code);
