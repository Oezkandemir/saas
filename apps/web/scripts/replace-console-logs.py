#!/usr/bin/env python3
"""
Script to replace console.log/error/warn/debug/info with logger calls
"""
import os
import re
import sys

def replace_console_logs(file_path):
    """Replace console.log statements with logger calls"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Check if logger is already imported
        has_logger_import = 'import { logger }' in content or 'from "@/lib/logger"' in content
        
        # Replace console.log with logger.info or logger.debug
        content = re.sub(r'console\.log\(([^)]+)\)', r'logger.debug(\1)', content)
        content = re.sub(r'console\.error\(([^)]+)\)', r'logger.error(\1)', content)
        content = re.sub(r'console\.warn\(([^)]+)\)', r'logger.warn(\1)', content)
        content = re.sub(r'console\.debug\(([^)]+)\)', r'logger.debug(\1)', content)
        content = re.sub(r'console\.info\(([^)]+)\)', r'logger.info(\1)', content)
        
        # Add logger import if needed and if file was modified
        if content != original_content and not has_logger_import:
            # Find the last import statement
            import_pattern = r'(import\s+[^;]+;)'
            imports = list(re.finditer(import_pattern, content))
            
            if imports:
                last_import = imports[-1]
                insert_pos = last_import.end()
                # Add logger import after last import
                content = content[:insert_pos] + '\nimport { logger } from "@/lib/logger";' + content[insert_pos:]
        
        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 replace-console-logs.py <file1> [file2] ...")
        sys.exit(1)
    
    files_modified = 0
    for file_path in sys.argv[1:]:
        if os.path.exists(file_path):
            if replace_console_logs(file_path):
                files_modified += 1
                print(f"Modified: {file_path}")
        else:
            print(f"File not found: {file_path}", file=sys.stderr)
    
    print(f"\nModified {files_modified} file(s)")

