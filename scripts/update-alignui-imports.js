#!/usr/bin/env node

/**
 * Script to update all imports from @/components/ui/* to @/components/alignui/*
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import mappings: old path -> new path
const importMappings = {
  'dialog': 'overlays/dialog',
  'select': 'forms/select',
  'dropdown-menu': 'overlays/dropdown-menu',
  'tabs': 'layout/tabs',
  'form': 'forms/form',
  'textarea': 'forms/textarea',
  'label': 'forms/label',
  'alert-dialog': 'overlays/alert-dialog',
  'switch': 'forms/switch',
  'popover': 'overlays/popover',
  'separator': 'data-display/separator',
  'accordion': 'layout/accordion',
  'alert': 'feedback/alert',
  'skeleton': 'data-display/skeleton',
  'progress': 'feedback/progress-bar',
  'scroll-area': 'data-display/scroll-area',
  'drawer': 'overlays/drawer',
};

// Component name mappings for named imports
const componentMappings = {
  // Dialog
  'Dialog': 'DialogRoot',
  'DialogTrigger': 'DialogTrigger',
  'DialogContent': 'DialogContent',
  'DialogHeader': 'DialogHeader',
  'DialogFooter': 'DialogFooter',
  'DialogTitle': 'DialogTitle',
  'DialogDescription': 'DialogDescription',
  
  // Select
  'Select': 'SelectRoot',
  'SelectRoot': 'SelectRoot',
  'SelectTrigger': 'SelectTrigger',
  'SelectContent': 'SelectContent',
  'SelectItem': 'SelectItem',
  'SelectValue': 'SelectValue',
  'SelectLabel': 'SelectLabel',
  'SelectSeparator': 'SelectSeparator',
  
  // DropdownMenu
  'DropdownMenu': 'DropdownMenuRoot',
  'DropdownMenuTrigger': 'DropdownMenuTrigger',
  'DropdownMenuContent': 'DropdownMenuContent',
  'DropdownMenuItem': 'DropdownMenuItem',
  'DropdownMenuLabel': 'DropdownMenuLabel',
  'DropdownMenuSeparator': 'DropdownMenuSeparator',
  'DropdownMenuShortcut': 'DropdownMenuShortcut',
  
  // Tabs
  'Tabs': 'TabsRoot',
  'TabsList': 'TabsList',
  'TabsTrigger': 'TabsTrigger',
  'TabsContent': 'TabsContent',
  
  // Form
  'Form': 'FormRoot',
  'FormField': 'FormField',
  'FormItem': 'FormItem',
  'FormLabel': 'FormLabel',
  'FormControl': 'FormControl',
  'FormDescription': 'FormDescription',
  'FormMessage': 'FormMessage',
  'useFormField': 'useFormField',
  
  // Textarea
  'Textarea': 'TextareaRoot',
  
  // Label
  'Label': 'LabelRoot',
  
  // AlertDialog
  'AlertDialog': 'AlertDialogRoot',
  'AlertDialogTrigger': 'AlertDialogTrigger',
  'AlertDialogContent': 'AlertDialogContent',
  'AlertDialogHeader': 'AlertDialogHeader',
  'AlertDialogFooter': 'AlertDialogFooter',
  'AlertDialogTitle': 'AlertDialogTitle',
  'AlertDialogDescription': 'AlertDialogDescription',
  'AlertDialogAction': 'AlertDialogAction',
  'AlertDialogCancel': 'AlertDialogCancel',
  
  // Switch
  'Switch': 'SwitchRoot',
  
  // Popover
  'Popover': 'PopoverRoot',
  'PopoverTrigger': 'PopoverTrigger',
  'PopoverContent': 'PopoverContent',
  'PopoverModal': 'PopoverModal',
  
  // Separator
  'Separator': 'SeparatorRoot',
  
  // Accordion
  'Accordion': 'AccordionRoot',
  'AccordionItem': 'AccordionItem',
  'AccordionTrigger': 'AccordionTrigger',
  'AccordionContent': 'AccordionContent',
  
  // Alert
  'Alert': 'AlertRoot',
  'AlertTitle': 'AlertTitle',
  'AlertDescription': 'AlertDescription',
  
  // Skeleton
  'Skeleton': 'SkeletonRoot',
  
  // Progress
  'Progress': 'ProgressBarRoot',
  'ProgressBar': 'ProgressBarRoot',
  
  // ScrollArea
  'ScrollArea': 'ScrollAreaRoot',
  'ScrollBar': 'ScrollBar',
  
  // Drawer
  'Drawer': 'DrawerRoot',
  'DrawerTrigger': 'DrawerTrigger',
  'DrawerContent': 'DrawerContent',
  'DrawerHeader': 'DrawerHeader',
  'DrawerFooter': 'DrawerFooter',
  'DrawerTitle': 'DrawerTitle',
  'DrawerDescription': 'DrawerDescription',
  'DrawerOverlay': 'DrawerOverlay',
  'DrawerPortal': 'DrawerPortal',
  'DrawerClose': 'DrawerClose',
};

function updateImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Update import paths
  for (const [oldPath, newPath] of Object.entries(importMappings)) {
    const oldImport = `@/components/ui/${oldPath}`;
    const newImport = `@/components/alignui/${newPath}`;
    
    // Update default imports
    const defaultImportRegex = new RegExp(`import\\s+([A-Za-z][A-Za-z0-9]*)\\s+from\\s+['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    if (defaultImportRegex.test(content)) {
      content = content.replace(defaultImportRegex, (match, componentName) => {
        const newComponentName = componentMappings[componentName] || componentName;
        modified = true;
        return `import { ${newComponentName} } from '${newImport}'`;
      });
    }
    
    // Update named imports
    const namedImportRegex = new RegExp(`import\\s*{([^}]+)}\\s+from\\s+['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    content = content.replace(namedImportRegex, (match, imports) => {
      const importList = imports.split(',').map(imp => {
        const trimmed = imp.trim();
        const parts = trimmed.split(/\s+as\s+/);
        const originalName = parts[0].trim();
        const alias = parts[1]?.trim();
        const newName = componentMappings[originalName] || originalName;
        return alias ? `${newName} as ${alias}` : newName;
      });
      modified = true;
      return `import { ${importList.join(', ')} } from '${newImport}'`;
    });
    
    // Update namespace imports
    const namespaceImportRegex = new RegExp(`import\\s*\\*\\s+as\\s+([A-Za-z][A-Za-z0-9]*)\\s+from\\s+['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    content = content.replace(namespaceImportRegex, (match, namespaceName) => {
      modified = true;
      return `import * as ${namespaceName} from '${newImport}'`;
    });
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main execution
const webDir = path.join(__dirname, '../apps/web');
const files = findFiles(webDir);

console.log(`Found ${files.length} files to check...`);

let updatedCount = 0;
files.forEach(file => {
  if (updateImportsInFile(file)) {
    updatedCount++;
  }
});

console.log(`\n✅ Updated ${updatedCount} files`);












