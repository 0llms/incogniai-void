import os
import re

REPO_DIR = '/home/hemesh/KodaAI/incogniai-void'
TARGET_DIRS = [
    os.path.join(REPO_DIR, 'src'),
    os.path.join(REPO_DIR, 'extensions'),
]
SINGLE_FILES = [
    os.path.join(REPO_DIR, 'product.json'),
    os.path.join(REPO_DIR, 'package.json'),
]

# Precise replacements targeting user-visible text strings
REPLACEMENTS = [
    ('Welcome to Void', 'Welcome to incogniAI IDE'),
    ('Void: ', 'incogniAI: '),
    ('Open Void Sidebar', 'Open incogniAI Sidebar'),
    ('Toggle Void Settings', 'Toggle incogniAI Settings'),
    ('Void Quick Edit', 'incogniAI Quick Edit'),
    ('Void Sidebar', 'incogniAI Sidebar'),
    ('Void Settings', 'incogniAI Settings'),
    ('Void Chat', 'incogniAI Chat'),
    ('Void Extension', 'incogniAI Extension'),
    ('Void can access', 'incogniAI IDE can access'),
    ('Void is up-to-date!', 'incogniAI IDE is up-to-date!'),
    ('Restart Void to update!', 'Restart incogniAI IDE to update!'),
    ('A new version of Void is available!', 'A new version of incogniAI IDE is available!'),
    ('Enter the Void', 'Enter incogniAI IDE'),
    ('Enter Void IDE', 'Enter incogniAI IDE'),
    ('.void-editor', '.incogniai-ide'),
    ('founders@voideditor.com', 'support@hsrprojects.org'),
    ('https://voideditor.com', 'https://chat.hsrprojects.org'),
    ("'Void'", "'incogniAI'"),
    ('"Void"', '"incogniAI"'),
    ('`Void`', '`incogniAI`'),
    ('title: \'Void\'', 'title: \'incogniAI\''),
    ('title: "Void"', 'title: "incogniAI"'),
    ('name: \'Void\'', 'name: \'incogniAI\''),
    ('name: "Void"', 'name: "incogniAI"'),
    ('label: \'Void\'', 'label: \'incogniAI\''),
    ('label: "Void"', 'label: "incogniAI"'),
]

def rebrand_file(filepath):
    if 'out/' in filepath or 'node_modules/' in filepath or '.git/' in filepath:
        return False
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return False

    original = content

    for old_str, new_str in REPLACEMENTS:
        if old_str in content:
            content = content.replace(old_str, new_str)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Rebranded: {filepath}")
        return True
    return False

def main():
    count = 0
    for root_dir in TARGET_DIRS:
        for root, dirs, files in os.walk(root_dir):
            for file in files:
                if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md')):
                    filepath = os.path.join(root, file)
                    if rebrand_file(filepath):
                        count += 1

    for filepath in SINGLE_FILES:
        if os.path.exists(filepath):
            if rebrand_file(filepath):
                count += 1

    print(f"Total rebranded files: {count}")

if __name__ == '__main__':
    main()
