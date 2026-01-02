#!/usr/bin/env python3
"""
Script zum Aktualisieren aller Imports von shadcn/ui zu AlignUI Komponenten
"""

import os
import re
from pathlib import Path

# Mapping von alten zu neuen Import-Pfaden
IMPORT_MAPPINGS = {
    r'@/components/ui/button': '@/components/alignui/actions/button',
    r'@/components/ui/card': '@/components/alignui/data-display/card',
    r'@/components/ui/input': '@/components/alignui/forms/input',
    r'@/components/ui/badge': '@/components/alignui/data-display/badge',
    r'@/components/ui/avatar': '@/components/alignui/data-display/avatar',
}

# Verzeichnisse, die ausgeschlossen werden sollen
EXCLUDE_DIRS = {
    'node_modules',
    '.next',
    '.git',
    'components/ui',  # Alte UI-Komponenten nicht ändern
    'components/alignui',  # AlignUI-Komponenten selbst nicht ändern
}

def should_process_file(file_path: Path) -> bool:
    """Prüft ob eine Datei verarbeitet werden soll"""
    # Nur TypeScript/TSX Dateien
    if not file_path.suffix in ['.ts', '.tsx']:
        return False
    
    # Prüfe ob Datei in einem ausgeschlossenen Verzeichnis ist
    parts = file_path.parts
    for exclude_dir in EXCLUDE_DIRS:
        if exclude_dir in parts:
            return False
    
    return True

def update_imports_in_file(file_path: Path) -> bool:
    """Aktualisiert Imports in einer Datei"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        updated = False
        
        # Ersetze alle Import-Mappings
        for old_import, new_import in IMPORT_MAPPINGS.items():
            # Pattern für verschiedene Import-Formate
            patterns = [
                (rf"from\s+['\"]({re.escape(old_import)})['\"]", f"from '{new_import}'"),
                (rf"from\s+['\"]({re.escape(old_import)})['\"]", f'from "{new_import}"'),
            ]
            
            for pattern, replacement in patterns:
                new_content = re.sub(pattern, replacement, content)
                if new_content != content:
                    content = new_content
                    updated = True
        
        # Schreibe nur wenn Änderungen vorgenommen wurden
        if updated:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    except Exception as e:
        print(f"Fehler beim Verarbeiten von {file_path}: {e}")
        return False

def main():
    """Hauptfunktion"""
    base_dir = Path('apps/web')
    
    if not base_dir.exists():
        print(f"Verzeichnis {base_dir} nicht gefunden!")
        return
    
    updated_files = []
    processed_files = 0
    
    print("🔄 Aktualisiere Imports zu AlignUI Komponenten...\n")
    
    # Durchsuche alle Dateien rekursiv
    for file_path in base_dir.rglob('*.ts*'):
        if should_process_file(file_path):
            processed_files += 1
            if update_imports_in_file(file_path):
                updated_files.append(file_path)
                print(f"✅ {file_path.relative_to(base_dir)}")
    
    print(f"\n📊 Zusammenfassung:")
    print(f"   Verarbeitete Dateien: {processed_files}")
    print(f"   Aktualisierte Dateien: {len(updated_files)}")
    
    if updated_files:
        print(f"\n✅ Alle Imports erfolgreich aktualisiert!")
    else:
        print(f"\n⚠️  Keine Dateien aktualisiert (möglicherweise bereits aktualisiert)")

if __name__ == '__main__':
    main()

