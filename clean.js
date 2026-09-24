const fs = require('fs');
const path = require('path');
const pagesDir = 'c:/Users/JM/Documents/Programming/React/esteRoute/frontend/src/pages';
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.tsx')) {
      let c = fs.readFileSync(full, 'utf8');
      
      // Remove header blocks completely
      c = c.replace(/<header[\s\S]*?<\/header>/g, '');
      
      // Replace outer wrappers with a generic w-full div
      c = c.replace(/className="min-h-screen flex items-center justify-center bg-slate-50 p-6"/g, 'className="w-full flex justify-center"');
      c = c.replace(/className="flex flex-col min-h-screen"/g, 'className="w-full"');
      c = c.replace(/className="flex-1 bg-gray-200 flex items-center justify-center p-6"/g, 'className="w-full"');
      c = c.replace(/className="flex-1 p-6 flex flex-col items-center justify-center"/g, 'className="w-full flex justify-center"');
      
      // Remove any trailing main wrappers that had flex-1
      c = c.replace(/<main className="[^"]*flex-1[^"]*">/g, '<div className="w-full">');
      c = c.replace(/<\/main>/g, '</div>');

      // Update old tailwind colors to use new theme colors in index.css
      c = c.replace(/bg-white/g, 'bg-surface border border-border-subtle text-text-primary');
      c = c.replace(/bg-gray-200/g, 'bg-surface-subtle');
      c = c.replace(/bg-gray-50/g, 'bg-surface-subtle');
      c = c.replace(/text-gray-700/g, 'text-text-secondary');
      c = c.replace(/text-gray-500/g, 'text-text-secondary');
      
      fs.writeFileSync(full, c);
      console.log('Cleaned', full);
    }
  }
}
walk(pagesDir);
