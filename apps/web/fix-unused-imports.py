#!/usr/bin/env python3
"""
Script to automatically fix unused imports and variables in TypeScript files.
This script reads the TypeScript error output and fixes common patterns.
"""

import re
import sys
from pathlib import Path

# Common patterns to fix
FIXES = {
    # Remove unused React imports
    r"^import\s+\*\s+as\s+React\s+from\s+['\"]react['\"];?\s*$": "",
    r"^import\s+React\s+from\s+['\"]react['\"];?\s*$": "",
    
    # Remove unused type imports (keep for now, need context)
    # Remove unused variables in function parameters (prefix with _)
}

def fix_file(file_path: Path, line_num: int, var_name: str):
    """Fix a specific unused variable in a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        if line_num > len(lines):
            return False
        
        line = lines[line_num - 1]
        
        # Try to fix common patterns
        # 1. Remove unused import
        if 'import' in line and var_name in line:
            # Check if it's the only import in the line
            if re.match(rf'^\s*import\s+.*\b{re.escape(var_name)}\b.*from.*$', line):
                # Remove the import
                lines[line_num - 1] = ""
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.writelines(lines)
                return True
        
        # 2. Prefix unused parameter with underscore
        if re.match(rf'^\s*\w+\s*=\s*.*\b{re.escape(var_name)}\b.*$', line):
            # Replace variable name with _variable_name
            lines[line_num - 1] = line.replace(var_name, f'_{var_name}')
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            return True
        
        return False
    except Exception as e:
        print(f"Error fixing {file_path}:{line_num}: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    print("This script would fix unused imports, but manual fixing is safer.")
    print("Please use the manual fixes provided.")



