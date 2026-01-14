#!/usr/bin/env node

/**
 * Migration Script: AlignUI → shadcn/ui Imports
 * 
 * Dieses Script ersetzt automatisch alle AlignUI Imports durch shadcn/ui Imports.
 * 
 * Usage:
 *   node scripts/migrate-to-shadcn-imports.js [--dry-run] [--path=apps/web]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import-Mapping: AlignUI → shadcn/ui
const importMappings = {
  // Actions
  '@/components/alignui/actions/button': '@/components/ui/button',
  '@/components/alignui/actions/link-button': '@/components/ui/button', // Wird zu Button mit variant="link"
  '@/components/alignui/actions/compact-button': '@/components/ui/button', // Wird zu Button mit size="sm"
  '@/components/alignui/actions/kbd': '@/components/ui/kbd', // Falls vorhanden, sonst custom behalten
  
  // Data Display
  '@/components/alignui/data-display/card': '@/components/ui/card',
  '@/components/alignui/data-display/avatar': '@/components/ui/avatar',
  '@/components/alignui/data-display/badge': '@/components/ui/badge',
  '@/components/alignui/data-display/table': '@/components/ui/table',
  '@/components/alignui/data-display/skeleton': '@/components/ui/skeleton',
  '@/components/alignui/data-display/separator': '@/components/ui/separator',
  '@/components/alignui/data-display/scroll-area': '@/components/ui/scroll-area',
  '@/components/alignui/data-display/status-badge': '@/components/ui/badge', // Custom Varianten
  '@/components/alignui/data-display/tag': '@/components/ui/badge', // Wird zu Badge
  '@/components/alignui/data-display/divider': '@/components/ui/separator',
  
  // Forms
  '@/components/alignui/forms/input': '@/components/ui/input',
  '@/components/alignui/forms/label': '@/components/ui/label',
  '@/components/alignui/forms/textarea': '@/components/ui/textarea',
  '@/components/alignui/forms/select': '@/components/ui/select',
  '@/components/alignui/forms/checkbox': '@/components/ui/checkbox',
  '@/components/alignui/forms/switch': '@/components/ui/switch',
  '@/components/alignui/forms/form': '@/components/ui/form',
  
  // Overlays
  '@/components/alignui/overlays/dialog': '@/components/ui/dialog',
  '@/components/alignui/overlays/alert-dialog': '@/components/ui/alert-dialog',
  '@/components/alignui/overlays/drawer': '@/components/ui/drawer', // Oder sheet
  '@/components/alignui/overlays/dropdown-menu': '@/components/ui/dropdown-menu',
  '@/components/alignui/overlays/popover': '@/components/ui/popover',
  '@/components/alignui/overlays/command-menu': '@/components/ui/command',
  
  // Layout
  '@/components/alignui/layout/tabs': '@/components/ui/tabs',
  '@/components/alignui/layout/accordion': '@/components/ui/accordion',
  '@/components/alignui/layout/divider': '@/components/ui/separator',
  
  // Feedback
  '@/components/alignui/feedback/alert': '@/components/ui/alert',
  '@/components/alignui/feedback/progress-bar': '@/components/ui/progress',
  '@/components/alignui/feedback/hint': '@/components/ui/form', // Wird zu FormDescription
};

// Komponenten-Namen-Mappings (für Named Imports)
const componentMappings = {
  // Button Varianten
  'LinkButton': 'Button',
  'CompactButton': 'Button',
  
  // Badge Varianten
  'BadgeRoot': 'Badge',
  'StatusBadge': 'Badge',
  'Tag': 'Badge',
  
  // Form Varianten
  'FormRoot': 'Form',
  'FormField': 'FormField',
  'FormItem': 'FormItem',
  'FormLabel': 'FormLabel',
  'FormControl': 'FormControl',
  'FormDescription': 'FormDescription',
  'FormMessage': 'FormMessage',
  
  // Dialog Varianten
  'DialogRoot': 'Dialog',
  'DialogTrigger': 'DialogTrigger',
  'DialogContent': 'DialogContent',
  'DialogHeader': 'DialogHeader',
  'DialogFooter': 'DialogFooter',
  'DialogTitle': 'DialogTitle',
  'DialogDescription': 'DialogDescription',
  
  // AlertDialog Varianten
  'AlertDialogRoot': 'AlertDialog',
  'AlertDialogTrigger': 'AlertDialogTrigger',
  'AlertDialogContent': 'AlertDialogContent',
  'AlertDialogHeader': 'AlertDialogHeader',
  'AlertDialogFooter': 'AlertDialogFooter',
  'AlertDialogTitle': 'AlertDialogTitle',
  'AlertDialogDescription': 'AlertDialogDescription',
  'AlertDialogAction': 'AlertDialogAction',
  'AlertDialogCancel': 'AlertDialogCancel',
  
  // Drawer Varianten
  'DrawerRoot': 'Drawer',
  'DrawerTrigger': 'DrawerTrigger',
  'DrawerContent': 'DrawerContent',
  'DrawerHeader': 'DrawerHeader',
  'DrawerFooter': 'DrawerFooter',
  'DrawerTitle': 'DrawerTitle',
  'DrawerDescription': 'DrawerDescription',
  'DrawerOverlay': 'DrawerOverlay',
  'DrawerPortal': 'DrawerPortal',
  'DrawerClose': 'DrawerClose',
  
  // DropdownMenu Varianten
  'DropdownMenuRoot': 'DropdownMenu',
  'DropdownMenuTrigger': 'DropdownMenuTrigger',
  'DropdownMenuContent': 'DropdownMenuContent',
  'DropdownMenuItem': 'DropdownMenuItem',
  'DropdownMenuLabel': 'DropdownMenuLabel',
  'DropdownMenuSeparator': 'DropdownMenuSeparator',
  'DropdownMenuShortcut': 'DropdownMenuShortcut',
  
  // Popover Varianten
  'PopoverRoot': 'Popover',
  'PopoverTrigger': 'PopoverTrigger',
  'PopoverContent': 'PopoverContent',
  'PopoverModal': 'PopoverModal',
  
  // Tabs Varianten
  'TabsRoot': 'Tabs',
  'TabsList': 'TabsList',
  'TabsTrigger': 'TabsTrigger',
  'TabsContent': 'TabsContent',
  
  // Accordion Varianten
  'AccordionRoot': 'Accordion',
  'AccordionItem': 'AccordionItem',
  'AccordionTrigger': 'AccordionTrigger',
  'AccordionContent': 'AccordionContent',
  
  // Alert Varianten
  'AlertRoot': 'Alert',
  'AlertTitle': 'AlertTitle',
  'AlertDescription': 'AlertDescription',
  
  // Progress Varianten
  'ProgressBarRoot': 'Progress',
  'ProgressBar': 'Progress',
  'Progress': 'Progress',
  
  // Avatar Varianten
  'AvatarImage': 'AvatarImage',
  'AvatarFallback': 'AvatarFallback',
  
  // Card Varianten
  'CardHeader': 'CardHeader',
  'CardFooter': 'CardFooter',
  'CardTitle': 'CardTitle',
  'CardDescription': 'CardDescription',
  'CardContent': 'CardContent',
  
  // Select Varianten
  'SelectRoot': 'Select',
  'SelectTrigger': 'SelectTrigger',
  'SelectContent': 'SelectContent',
  'SelectItem': 'SelectItem',
  'SelectValue': 'SelectValue',
  'SelectLabel': 'SelectLabel',
  'SelectSeparator': 'SelectSeparator',
  
  // Checkbox Varianten
  'CheckboxRoot': 'Checkbox',
  
  // Switch Varianten
  'SwitchRoot': 'Switch',
  
  // Textarea Varianten
  'TextareaRoot': 'Textarea',
  
  // Label Varianten
  'LabelRoot': 'Label',
  
  // Input Varianten
  'InputRoot': 'Input',
  
  // Separator Varianten
  'SeparatorRoot': 'Separator',
  
  // ScrollArea Varianten
  'ScrollAreaRoot': 'ScrollArea',
  'ScrollBar': 'ScrollBar',
  
  // Skeleton Varianten
  'SkeletonRoot': 'Skeleton',
};

// Statistiken
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  importsReplaced: 0,
  errors: [],
};

/**
 * Findet alle TypeScript/TSX Dateien rekursiv
 */
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignoriere node_modules, .next, etc.
      if (!['node_modules', '.next', '.turbo', 'dist', 'build'].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Ersetzt Imports in einer Datei
 */
function replaceImports(filePath, dryRun = false) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let importsReplaced = 0;
    
    // Ersetze Import-Pfade
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      const regex = new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(oldImport)) {
        content = content.replace(regex, newImport);
        modified = true;
        importsReplaced++;
      }
    }
    
    // Ersetze Named Imports (komplexer, benötigt AST-Parsing für vollständige Unterstützung)
    // Für jetzt: Einfache String-Ersetzung für häufige Fälle
    
    // Spezielle Fälle
    // LinkButton → Button mit variant="link"
    if (content.includes('LinkButton')) {
      content = content.replace(/LinkButton/g, 'Button');
      modified = true;
    }
    
    // CompactButton → Button mit size="sm"
    if (content.includes('CompactButton')) {
      content = content.replace(/CompactButton/g, 'Button');
      modified = true;
    }
    
    // BadgeRoot → Badge
    if (content.includes('BadgeRoot')) {
      content = content.replace(/BadgeRoot\s+as\s+Badge/g, 'Badge');
      content = content.replace(/BadgeRoot/g, 'Badge');
      modified = true;
    }
    
    // StatusBadge → Badge
    if (content.includes('StatusBadge')) {
      content = content.replace(/StatusBadge/g, 'Badge');
      modified = true;
    }
    
    // Tag → Badge
    if (content.includes('Tag')) {
      // Vorsicht: Nur ersetzen wenn es aus alignui importiert wird
      if (content.includes('@/components/alignui/data-display/tag')) {
        content = content.replace(/Tag/g, 'Badge');
        modified = true;
      }
    }
    
    // Divider → Separator
    if (content.includes('Divider') && content.includes('@/components/alignui/layout/divider')) {
      content = content.replace(/Divider/g, 'Separator');
      modified = true;
    }
    
    // ProgressBar → Progress
    if (content.includes('ProgressBar')) {
      content = content.replace(/ProgressBar/g, 'Progress');
      modified = true;
    }
    
    // Hint → FormDescription (nur wenn aus alignui/feedback/hint)
    if (content.includes('Hint') && content.includes('@/components/alignui/feedback/hint')) {
      content = content.replace(/Hint/g, 'FormDescription');
      modified = true;
    }
    
    if (modified && !dryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesModified++;
      stats.importsReplaced += importsReplaced;
    }
    
    if (modified) {
      stats.filesProcessed++;
    }
    
    return modified;
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    return false;
  }
}

/**
 * Hauptfunktion
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const pathArg = args.find(arg => arg.startsWith('--path='));
  const targetPath = pathArg ? pathArg.split('=')[1] : 'apps/web';
  
  const fullPath = path.resolve(process.cwd(), targetPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Pfad nicht gefunden: ${fullPath}`);
    process.exit(1);
  }
  
  console.log(`🔍 Suche nach Dateien in: ${fullPath}`);
  console.log(`📝 Modus: ${dryRun ? 'DRY RUN (keine Änderungen)' : 'LIVE (Dateien werden geändert)'}\n`);
  
  const files = findFiles(fullPath);
  console.log(`📁 Gefunden: ${files.length} Dateien\n`);
  
  // Verarbeite Dateien
  files.forEach(file => {
    replaceImports(file, dryRun);
  });
  
  // Zeige Statistiken
  console.log('\n📊 Statistiken:');
  console.log(`   Dateien verarbeitet: ${stats.filesProcessed}`);
  console.log(`   Dateien geändert: ${stats.filesModified}`);
  console.log(`   Imports ersetzt: ${stats.importsReplaced}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Fehler: ${stats.errors.length}`);
    stats.errors.forEach(({ file, error }) => {
      console.log(`   ${file}: ${error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 Tipp: Führe ohne --dry-run aus, um die Änderungen zu speichern.');
  } else {
    console.log('\n✅ Migration abgeschlossen!');
    console.log('⚠️  WICHTIG: Bitte prüfe die Dateien manuell und passe Komponenten-Props an.');
  }
}

// Führe Script aus
if (require.main === module) {
  main();
}

module.exports = { importMappings, componentMappings };
