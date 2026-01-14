#!/usr/bin/env node

/**
 * Fix Component Names Script
 * 
 * Ersetzt AlignUI-spezifische Komponenten-Namen durch shadcn/ui Standard-Namen
 */

const fs = require('fs');
const path = require('path');

const replacements = [
  // SeparatorRoot → Separator
  {
    pattern: /SeparatorRoot\s+as\s+Separator/g,
    replacement: 'Separator'
  },
  {
    pattern: /import\s*{\s*SeparatorRoot\s+as\s+Separator\s*}\s*from\s*["']@\/components\/ui\/separator["']/g,
    replacement: 'import { Separator } from "@/components/ui/separator"'
  },
  {
    pattern: /SeparatorRoot/g,
    replacement: 'Separator'
  },
  
  // AccordionRoot → Accordion
  {
    pattern: /AccordionRoot/g,
    replacement: 'Accordion'
  },
  
  // SelectRoot → Select (nur wenn nicht in select.tsx selbst)
  {
    pattern: /SelectRoot(?![a-zA-Z])/g,
    replacement: 'Select'
  },
  
  // ScrollAreaRoot → ScrollArea
  {
    pattern: /ScrollAreaRoot\s+as\s+ScrollArea/g,
    replacement: 'ScrollArea'
  },
  {
    pattern: /import\s*{\s*ScrollAreaRoot\s+as\s+ScrollArea\s*}\s*from\s*["']@\/components\/ui\/scroll-area["']/g,
    replacement: 'import { ScrollArea } from "@/components/ui/scroll-area"'
  },
  {
    pattern: /ScrollAreaRoot/g,
    replacement: 'ScrollArea'
  },
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Skip if it's the select.tsx file itself (it defines SelectRoot)
    if (filePath.includes('components/ui/select.tsx')) {
      return false;
    }
    
    // Skip alignui directory
    if (filePath.includes('components/alignui/')) {
      return false;
    }
    
    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.turbo', 'dist', 'build'].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function main() {
  const targetPath = process.argv[2] || 'apps/web';
  const fullPath = path.resolve(process.cwd(), targetPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Pfad nicht gefunden: ${fullPath}`);
    process.exit(1);
  }
  
  console.log(`🔍 Suche nach Dateien in: ${fullPath}\n`);
  
  const files = findFiles(fullPath);
  console.log(`📁 Gefunden: ${files.length} Dateien\n`);
  
  let modifiedCount = 0;
  
  files.forEach(file => {
    if (processFile(file)) {
      modifiedCount++;
      console.log(`✅ Geändert: ${file}`);
    }
  });
  
  console.log(`\n📊 Statistiken:`);
  console.log(`   Dateien geändert: ${modifiedCount}`);
  console.log(`\n✅ Fertig!`);
}

if (require.main === module) {
  main();
}

module.exports = { processFile, replacements };
