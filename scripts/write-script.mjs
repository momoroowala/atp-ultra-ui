
import fs from 'fs';
const OUTPUT = 'C:/Users/moham/Documents/Coretex/tools/atp_ultra/scripts/generate-executive-summary.mjs';
const script = [];
script.push("import PDFDocument from 'pdfkit';");
script.push("import fs from 'fs';");
script.push("import path from 'path';");
script.push("import { fileURLToPath } from 'url';");
script.push("");
script.push("const __dirname = path.dirname(fileURLToPath(import.meta.url));");
script.push("const OUTPUT = path.join(__dirname, '..', 'ATP_Ultra_Executive_Summary.pdf');");
script.push("");
script.push("const G = '#2D8F64', R = '#CC3333', O = '#E07C24', D = '#1A1A1A', GY = '#555555', LG = '#999999', BG = '#F5F7F5';");
fs.writeFileSync(OUTPUT, script.join('
'));
console.log('partial');
