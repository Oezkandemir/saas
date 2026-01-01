#!/usr/bin/env python3
"""
Script to replace all console.log/error/warn/debug/info with logger calls
Recursively processes all TypeScript/TSX files in apps/web
"""
import os
import re
import sys
from pathlib import Path

def has_logger_import(content: str) -> bool:
    """Check if logger is already imported"""
    patterns = [
        r'import\s+{\s*logger\s*}\s+from\s+["\']@/lib/logger["\']',
        r'import\s+{\s*logger\s*}\s+from\s+["\']@/lib/logger["\']',
        r'from\s+["\']@/lib/logger["\']',
    ]
    return any(re.search(pattern, content) for pattern in patterns)

def add_logger_import(content: str) -> str:
    """Add logger import after the last import statement"""
    # Find all import statements
    import_pattern = r'(import\s+[^;]+;|import\s+[^;]+\n[^;]+;)'
    imports = list(re.finditer(import_pattern, content, re.MULTILINE))
    
    if imports:
        last_import = imports[-1]
        insert_pos = last_import.end()
        # Check if there's already a logger import
        if not has_logger_import(content[:insert_pos]):
            logger_import = '\nimport { logger } from "@/lib/logger";'
            content = content[:insert_pos] + logger_import + content[insert_pos:]
    else:
        # No imports found, add at the top (after "use server" or "use client" if present)
        use_directive_pattern = r'("use\s+(server|client)";\s*\n)'
        match = re.search(use_directive_pattern, content)
        if match:
            insert_pos = match.end()
            logger_import = 'import { logger } from "@/lib/logger";\n'
            content = content[:insert_pos] + logger_import + content[insert_pos:]
        else:
            # Add at the very beginning
            logger_import = 'import { logger } from "@/lib/logger";\n\n'
            content = logger_import + content
    
    return content

def replace_console_logs(file_path: Path) -> bool:
    """Replace console.log statements with logger calls"""
    try:
        # Skip script files and node_modules
        if 'scripts' in str(file_path) and file_path.suffix == '.py':
            return False
        if 'node_modules' in str(file_path):
            return False
        if 'logger.ts' in str(file_path):
            return False  # Don't modify logger.ts itself
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Replace console methods with logger methods
        # console.log -> logger.debug (for development debugging)
        content = re.sub(r'console\.log\s*\(', 'logger.debug(', content)
        # console.error -> logger.error
        content = re.sub(r'console\.error\s*\(', 'logger.error(', content)
        # console.warn -> logger.warn
        content = re.sub(r'console\.warn\s*\(', 'logger.warn(', content)
        # console.debug -> logger.debug
        content = re.sub(r'console\.debug\s*\(', 'logger.debug(', content)
        # console.info -> logger.info
        content = re.sub(r'console\.info\s*\(', 'logger.info(', content)
        
        # Add logger import if needed and if file was modified
        if content != original_content and not has_logger_import(content):
            content = add_logger_import(content)
        
        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}", file=sys.stderr)
        return False

def main():
    """Main function to process all files"""
    base_dir = Path(__file__).parent.parent  # apps/web directory
    files_modified = 0
    files_processed = 0
    
    # Find all TypeScript and TSX files
    for pattern in ['**/*.ts', '**/*.tsx']:
        for file_path in base_dir.rglob(pattern):
            # Skip certain directories
            if any(skip in str(file_path) for skip in ['node_modules', '.next', 'dist', 'build']):
                continue
        
        files_processed += 1
        if replace_console_logs(file_path):
            files_modified += 1
            print(f"Modified: {file_path.relative_to(base_dir)}")
    
    print(f"\nProcessed {files_processed} file(s), modified {files_modified} file(s)")

if __name__ == "__main__":
    main()

