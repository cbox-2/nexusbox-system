import glob
import re
import os

# ============================================
# 1. Subbar HTML template
# ============================================
SUBBAR_HTML = '''
<div id="subbar">
<div class="wrap">
<a href="/dashboard/index.html" class="submenuitem"><b id="cbox-name">DASHBOARD</b></a>
<a href="/publish/publish.html" class="submenuitem">Publish</a>
<a href="#" id="hovmenu1" class="submenuitem">Look &amp; feel</a>
<a href="#" id="hovmenu2" class="submenuitem">Options</a>
<a href="#" id="hovmenu3" class="submenuitem">Users</a>
<a href="#" id="hovmenu4" class="submenuitem">Messages</a>
</div>
</div>

<div id="bar3">
<div id="hovmenu" class="wrap" style="display:none"></div>
</div>
'''

# ============================================
# 2. Scripts to add before </body>
# ============================================
SCRIPTS = '''
<script src="/shared/toolbar.js"></script>
<script src="/shared/auth.js"></script>
<script src="/shared/nav.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
if (typeof loadUserInfo === 'function') loadUserInfo();
});
</script>
'''

# ============================================
# 3. CSS links to add in <head>
# ============================================
CSS_LINKS = '''<link rel="stylesheet" href="/shared/toolbar.css">
<link rel="stylesheet" href="/shared/buttons.css">
<link rel="icon" type="image/svg+xml" href="/shared/favicon.svg">
<meta name="description" content="NexusBox - Professional chat platform">
<link rel="canonical" href="https://nexusbox-system-production-c290.up.railway.app/">
'''

# ============================================
# 4. Link map for broken links
# ============================================
LINK_MAP = {
    'About': '/about.html',
    'Plans &amp; pricing': '/pricing.html',
    'Plans & pricing': '/pricing.html',
    'Terms &amp; conditions': '/terms.html',
    'Terms & conditions': '/terms.html',
    'Privacy policy': '/privacy.html',
    'Notices': '/notices.html',
    'Contact us': '/contact.html',
    'Support': '/contact.html',
    'My Cboxes': '/dashboard/index.html',
    'My Account': '/dashboard/index.html',
}

# ============================================
# 5. Find all HTML files
# ============================================
html_files = glob.glob('public/**/*.html', recursive=True)

# Skip login and signup (they have their own structure)
skip_files = ['login/index.html', 'signup/signup.html']

stats = {
    'total': 0,
    'added_subbar': 0,
    'added_scripts': 0,
    'added_css': 0,
    'fixed_links': 0,
    'skipped': 0
}

for html_file in html_files:
    # Skip login/signup
    rel_path = html_file.replace('public/', '')
    if any(skip in rel_path for skip in skip_files):
        stats['skipped'] += 1
        continue
    
    stats['total'] += 1
    
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # ============================================
    # A. Add subbar if missing
    # ============================================
    if 'id="subbar"' not in content:
        # Find insertion point
        if '<div id="main"' in content:
            content = content.replace(
                '<div id="main"',
                SUBBAR_HTML + '\n\t<div id="main"'
            )
            stats['added_subbar'] += 1
        elif '<div id="content"' in content:
            content = content.replace(
                '<div id="content"',
                SUBBAR_HTML + '\n\t<div id="content"'
            )
            stats['added_subbar'] += 1
    
    # ============================================
    # B. Add scripts if missing
    # ============================================
    if 'nav.js' not in content and '</body>' in content:
        content = content.replace('</body>', SCRIPTS + '\n</body>')
        stats['added_scripts'] += 1
    
    # ============================================
    # C. Add CSS if missing
    # ============================================
    if 'toolbar.css' not in content and '</head>' in content:
        content = content.replace('</head>', CSS_LINKS + '</head>')
        stats['added_css'] += 1
    
    # ============================================
    # D. Fix broken footer/header links
    # ============================================
    for text, url in LINK_MAP.items():
        # Pattern 1: href="#" with text
        pattern1 = r'href="#"([^>]*)>' + re.escape(text) + r'</a>'
        content = re.sub(pattern1, 'href="' + url + r'"\1>' + text + r'</a>', content)
        
        # Pattern 2: href="" with text
        pattern2 = r'href=""([^>]*)>' + re.escape(text) + r'</a>'
        content = re.sub(pattern2, 'href="' + url + r'"\1>' + text + r'</a>', content)
    
    # Fix cbox.ws links
    content = content.replace('https://www.cbox.ws/admin?preproc=logout', '#')
    content = content.replace('https://www.cbox.ws/help', '/contact.html')
    content = content.replace('https://www.cbox.ws/admin?switch', '/dashboard/index.html')
    content = content.replace('https://www.cbox.ws/admin?acct', '/dashboard/index.html')
    
    # Fix logo link
    content = content.replace('href="https://www.cbox.ws/"', 'href="/dashboard/index.html"')
    
    # ============================================
    # E. Save if changed
    # ============================================
    if content != original:
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'✅ Updated: {html_file}')

print('\n' + '='*50)
print(' STATISTICS')
print('='*50)
print(f'Total files processed: {stats["total"]}')
print(f'Skipped (login/signup): {stats["skipped"]}')
print(f'Added subbar: {stats["added_subbar"]}')
print(f'Added scripts: {stats["added_scripts"]}')
print(f'Added CSS: {stats["added_css"]}')
print('='*50)

# ============================================
# 6. Count remaining broken links
# ============================================
total_broken = 0
for html_file in glob.glob('public/**/*.html', recursive=True):
    with open(html_file, 'r', encoding='utf-8') as f:
        c = f.read()
    count = c.count('href="#"')
    if count > 0:
        total_broken += count
        print(f'⚠️  {html_file}: {count} broken links remaining')

print(f'\n🔗 Total broken links remaining: {total_broken}')
