import os
import re

def find_unused():
    src_dir = r"d:\portfolio\portfolio\src"
    all_files = []
    
    # Collect all JS/JSX files to check for imports
    code_files = []
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in ['.js', '.jsx', '.ts', '.tsx', '.css']:
                path = os.path.join(root, file)
                all_files.append(path)
                if ext in ['.js', '.jsx', '.ts', '.tsx']:
                    code_files.append(path)

    unused = []
    
    for target in all_files:
        filename = os.path.basename(target)
        # Skip index files, App.js, reportWebVitals
        if filename in ['App.js', 'index.js', 'index.css', 'sanity.js']:
            continue
            
        # extract base without extension
        base = os.path.splitext(filename)[0]
        
        is_used = False
        for code_file in code_files:
            if code_file == target:
                continue
            with open(code_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                # Check for import or string reference
                if filename in content or (ext in ['.js', '.jsx', '.ts', '.tsx'] and base in content):
                    is_used = True
                    break
        
        if not is_used:
            unused.append(target)

    for u in unused:
        print("Unused:", u)

if __name__ == "__main__":
    find_unused()
