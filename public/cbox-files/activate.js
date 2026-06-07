// NexusBox Activation Script v4.0 - يعمل مع بنية Cbox الأصلية
const API = window.location.origin;
const TOKEN = localStorage.getItem('token');
let currentBoxId = localStorage.getItem('currentBoxId');
let currentBoxData = null;

// ===== AUTH =====
function checkAuth() {
  const publicPages = ['/', '/index.html', '/test.html', '/api-test.html', '/chat.html', '/embed.html', '/login.html', '/signup.html'];
  if (publicPages.some(p => window.location.pathname.includes(p))) return true;
  if (!TOKEN) { console.log('Login required'); return false; }
  return true;
}

function loadUserInfo() {
  if (!TOKEN) return;
  fetch(API + '/api/auth/me', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.user) {
        const w = document.getElementById('userWelcome');
        if (w) w.textContent = d.user.email;
        // Account page
        if (document.getElementById('userEmail')) document.getElementById('userEmail').value = d.user.email;
        if (document.getElementById('userId')) document.getElementById('userId').value = d.user._id;
        if (document.getElementById('memberSince')) document.getElementById('memberSince').value = new Date(d.user.createdAt).toLocaleDateString();
      }
    });
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = '/';
}

// ===== BOXES =====
function loadBoxes() {
  if (!TOKEN) return;
  fetch(API + '/api/boxes', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.boxes && d.boxes.length > 0) {
        if (!currentBoxId) {
          currentBoxId = d.boxes[0]._id;
          localStorage.setItem('currentBoxId', currentBoxId);
        }
        // Update submenu
        const submenu = document.querySelector('#subbar .submenuitem b');
        if (submenu) {
          const currentBox = d.boxes.find(b => b._id === currentBoxId);
          if (currentBox) submenu.textContent = currentBox.name;
        }
        // Load current box data
        loadCurrentBox();
        // Load table if on index page
        if (window.location.pathname.includes('/admin/index.html')) {
          loadBoxesTable(d.boxes);
        }
      }
    });
}

function loadCurrentBox() {
  if (!currentBoxId) return;
  fetch(API + '/api/boxes/' + currentBoxId, { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.box) {
        currentBoxData = d.box;
        populatePageData();
      }
    });
}

function loadBoxesTable(boxes) {
  const table = document.querySelector('#content table');
  if (!table) return;
  let html = '<table><thead><tr><th>Name</th><th>Slug</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
  boxes.forEach(b => {
    html += `<tr>
      <td>${b.name}</td>
      <td>${b.slug}</td>
      <td>${b.status}</td>
      <td>
        <a href="/admin/messages.html?box=${b._id}">Manage</a> | 
        <a href="/admin/publish.html?key=${b.embedKey}">Publish</a>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  table.outerHTML = html;
}

// ===== POPULATE PAGE DATA =====
function populatePageData() {
  if (!currentBoxData) return;
  const box = currentBoxData;
  const path = window.location.pathname;
  
  // Options page (settings)
  if (path.includes('options.html') && !path.includes('options-')) {
    const f = document.forms['settings'];
    if (f) {
      if (f.mpl) f.mpl.value = box.settings?.messagesPerPage || 20;
      if (f.allowemail) f.allowemail.checked = box.settings?.allowEmail !== false;
      if (f.avatars) f.avatars.checked = box.settings?.avatars !== false;
      if (f.boxcode) f.boxcode.checked = box.posting?.boxCode !== false;
      if (f.pm) f.pm.checked = box.posting?.pm || false;
      if (f.moderated) f.moderated.checked = box.posting?.moderated || false;
      if (f.mic) f.mic.checked = box.posting?.mic !== false;
    }
  }
  
  // Date options
  if (path.includes('options-date.html')) {
    const f = document.forms['dateopt'];
    if (f) {
      if (f.dateformat) f.dateformat.value = box.dateSettings?.dateFormat || 'DD/MM/YYYY';
      if (f.timeformat) f.timeformat.value = box.dateSettings?.timeFormat || '24h';
    }
  }
  
  // Emoji options
  if (path.includes('options-emoji.html')) {
    const f = document.forms['fsmilies'];
    if (f) {
      if (f.emoji_enabled) f.emoji_enabled.checked = box.emojiSettings?.enabled !== false;
      if (f.emoji_list) f.emoji_list.value = (box.emojiSettings?.allowed || []).join('\n');
    }
  }
  
  // Filter options
  if (path.includes('options-filter.html')) {
    const f = document.forms['ffilter'];
    if (f) {
      if (f.filter_enabled) f.filter_enabled.checked = box.filterSettings?.enabled !== false;
      if (f.bannedwords) f.bannedwords.value = (box.filterSettings?.bannedWords || []).join('\n');
      if (f.filterlinks) f.filterlinks.checked = box.filterSettings?.filterLinks || false;
    }
  }
  
  // Look & Feel - Theme
  if (path.includes('lookfeel.html') && !path.includes('layout')) {
    const f = document.forms['styleadv'];
    if (f && f.advancedcss) {
      f.advancedcss.value = box.theme?.customCss || '';
    }
  }
  
  // Look & Feel - Layout
  if (path.includes('lookfeel-layout.html')) {
    const f = document.forms['flayout'];
    if (f) {
      if (f.width) f.width.value = box.layout?.width || 400;
      if (f.height) f.height.value = box.layout?.height || 500;
      if (f.formheight) f.formheight.value = box.layout?.formHeight || 107;
    }
  }
  
  // Webhook
  if (path.includes('webhook.html')) {
    const f = document.forms['fpostopt'];
    if (f) {
      if (f.url) f.url.value = box.webhook?.url || '';
      if (f.enabled) f.enabled.checked = box.webhook?.enabled || false;
    }
  }
  
  // Messages
  if (path.includes('messages.html') && !path.includes('messages-')) {
    loadMessages();
  }
  
  // Sticky messages
  if (path.includes('messages-sticky.html')) {
    loadStickyMessages();
  }
  
  // Archived messages
  if (path.includes('messages-archive.html')) {
    loadArchivedMessages();
  }
  
  // Channels
  if (path.includes('messages-channels.html')) {
    loadChannels();
  }
  
  // Users
  if (path.includes('users.html') && !path.includes('users-')) {
    loadUsers();
  }
  
  // Banned users
  if (path.includes('users-banned.html')) {
    loadBannedUsers();
  }
  
  // Publish
  if (path.includes('publish.html')) {
    loadPublishPage();
  }
}

// ===== MESSAGES =====
function loadMessages() {
  if (!currentBoxId) return;
  fetch(API + '/api/boxes/' + currentBoxId + '/messages', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.messages) {
        const tbody = document.querySelector('#content table tbody');
        if (tbody) {
          tbody.innerHTML = '';
          d.messages.forEach(m => {
            const row = tbody.insertRow();
            row.innerHTML = `
              <td>${m.content.substring(0, 100)}</td>
              <td>${m.author?.username || 'Guest'}</td>
              <td>${new Date(m.createdAt).toLocaleString()}</td>
              <td><input type="button" value="Delete" onclick="deleteMessage('${m._id}')" class="Danger"></td>
            `;
          });
        }
      }
    });
}

function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  fetch(API + '/api/messages/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => { if (d.success) location.reload(); });
}

function loadStickyMessages() {
  if (!currentBoxId) return;
  fetch(API + '/api/boxes/' + currentBoxId + '/messages?sticky=true', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.messages) {
        const tbody = document.querySelector('#content table tbody');
        if (tbody) {
          tbody.innerHTML = '';
          d.messages.forEach(m => {
            const row = tbody.insertRow();
            row.innerHTML = `
              <td>${m.content}</td>
              <td>${m.author?.username || 'Guest'}</td>
              <td>${new Date(m.createdAt).toLocaleString()}</td>
              <td><input type="button" value="Delete" onclick="deleteMessage('${m._id}')" class="Danger"></td>
            `;
          });
        }
      }
    });
}

function loadArchivedMessages() {
  if (!currentBoxId) return;
  fetch(API + '/api/boxes/' + currentBoxId + '/messages?archived=true', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.messages) {
        const tbody = document.querySelector('#content table tbody');
        if (tbody) {
          tbody.innerHTML = '';
          d.messages.forEach(m => {
            const row = tbody.insertRow();
            row.innerHTML = `
              <td>${m.content}</td>
              <td>${m.author?.username || 'Guest'}</td>
              <td>${new Date(m.createdAt).toLocaleString()}</td>
              <td><input type="button" value="Delete" onclick="deleteMessage('${m._id}')" class="Danger"></td>
            `;
          });
        }
      }
    });
}

// ===== CHANNELS =====
function loadChannels() {
  if (!currentBoxId) return;
  fetch(API + '/api/boxes/' + currentBoxId + '/channels', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.channels) {
        const tbody = document.querySelector('#content table tbody');
        if (tbody) {
          tbody.innerHTML = '';
          d.channels.forEach(c => {
            const row = tbody.insertRow();
            row.innerHTML = `
              <td>${c.name}</td>
              <td>${c.description || '-'}</td>
              <td><input type="button" value="Delete" onclick="deleteChannel('${c._id}')" class="Danger"></td>
            `;
          });
        }
      }
    });
}

function deleteChannel(id) {
  if (!confirm('Delete this channel?')) return;
  fetch(API + '/api/channels/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => { if (d.success) location.reload(); });
}

// ===== USERS =====
function loadUsers() {
  if (!currentBoxId) return;
  fetch(API + '/api/boxes/' + currentBoxId + '/users', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.users) {
        const tbody = document.querySelector('#content table tbody');
        if (tbody) {
          tbody.innerHTML = '';
          d.users.forEach(u => {
            const row = tbody.insertRow();
            row.innerHTML = `
              <td>${u.username}</td>
              <td>${u.email || '-'}</td>
              <td>${u.level}</td>
              <td><input type="button" value="Delete" onclick="deleteUser('${u._id}')" class="Danger"></td>
            `;
          });
        }
      }
    });
}

function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  fetch(API + '/api/users/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => { if (d.success) location.reload(); });
}

function loadBannedUsers() {
  if (!currentBoxId) return;
  fetch(API + '/api/boxes/' + currentBoxId + '/bans', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.bans) {
        const tbody = document.querySelector('#content table tbody');
        if (tbody) {
          tbody.innerHTML = '';
          d.bans.forEach(b => {
            const row = tbody.insertRow();
            row.innerHTML = `
              <td>${b.target}</td>
              <td>${b.reason || '-'}</td>
              <td>${b.duration > 0 ? b.duration + ' hours' : 'Permanent'}</td>
              <td><input type="button" value="Remove" onclick="removeBan('${b._id}')" class="Danger"></td>
            `;
          });
        }
      }
    });
}

function removeBan(id) {
  if (!confirm('Remove this ban?')) return;
  fetch(API + '/api/bans/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => { if (d.success) location.reload(); });
}

// ===== PUBLISH =====
function loadPublishPage() {
  const params = new URLSearchParams(window.location.search);
  const key = params.get('key');
  if (key) {
    const iframe = document.querySelector('#content iframe');
    if (iframe) iframe.src = '/chat.html?key=' + key;
  }
}

// ===== INTERCEPT FORMS =====
function interceptForms() {
  // Settings form
  const settingsForm = document.forms['settings'];
  if (settingsForm) {
    settingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      const data = {
        messagesPerPage: parseInt(this.mpl?.value) || 20,
        allowEmail: this.allowemail?.checked || false,
        avatars: this.avatars?.checked || false,
        sortDirection: 1,
        language: 'ar',
        timezone: 'Asia/Baghdad'
      };
      const posting = {
        boxCode: this.boxcode?.checked || false,
        pm: this.pm?.checked || false,
        moderated: this.moderated?.checked || false,
        mic: this.mic?.checked || false
      };
      Promise.all([
        fetch(API + '/api/boxes/' + currentBoxId + '/settings', {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }),
        fetch(API + '/api/boxes/' + currentBoxId, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ posting })
        })
      ]).then(() => alert('Settings saved!')).catch(() => alert('Error saving'));
    });
  }
  
  // Style form (theme)
  const styleForm = document.forms['styleadv'];
  if (styleForm) {
    styleForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      fetch(API + '/api/boxes/' + currentBoxId + '/theme', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customCss: this.advancedcss?.value || '' })
      }).then(() => alert('Theme saved!')).catch(() => alert('Error saving'));
    });
  }
  
  // Layout form
  const layoutForm = document.forms['flayout'];
  if (layoutForm) {
    layoutForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      fetch(API + '/api/boxes/' + currentBoxId + '/layout', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width: parseInt(this.width?.value) || 400,
          height: parseInt(this.height?.value) || 500,
          formHeight: parseInt(this.formheight?.value) || 107
        })
      }).then(() => alert('Layout saved!')).catch(() => alert('Error saving'));
    });
  }
  
  // Webhook form
  const webhookForm = document.forms['fpostopt'];
  if (webhookForm) {
    webhookForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      fetch(API + '/api/boxes/' + currentBoxId + '/webhook', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: this.url?.value || '',
          enabled: this.enabled?.checked || false
        })
      }).then(() => alert('Webhook saved!')).catch(() => alert('Error saving'));
    });
  }
  
  // Date options
  const dateForm = document.forms['dateopt'];
  if (dateForm) {
    dateForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      fetch(API + '/api/boxes/' + currentBoxId + '/date-settings', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateFormat: this.dateformat?.value || 'DD/MM/YYYY',
          timeFormat: this.timeformat?.value || '24h'
        })
      }).then(() => alert('Date settings saved!')).catch(() => alert('Error saving'));
    });
  }
  
  // Emoji options
  const emojiForm = document.forms['fsmilies'];
  if (emojiForm) {
    emojiForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      fetch(API + '/api/boxes/' + currentBoxId + '/emoji-settings', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: this.emoji_enabled?.checked || false,
          allowed: (this.emoji_list?.value || '').split('\n').filter(x => x.trim())
        })
      }).then(() => alert('Emoji settings saved!')).catch(() => alert('Error saving'));
    });
  }
  
  // Filter options
  const filterForm = document.forms['ffilter'];
  if (filterForm) {
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      fetch(API + '/api/boxes/' + currentBoxId + '/filter-settings', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: this.filter_enabled?.checked || false,
          bannedWords: (this.bannedwords?.value || '').split('\n').filter(x => x.trim()),
          filterLinks: this.filterlinks?.checked || false
        })
      }).then(() => alert('Filter settings saved!')).catch(() => alert('Error saving'));
    });
  }
  
  // Password form
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const fd = new FormData(this);
      fetch(API + '/api/auth/change-password', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: fd.get('currentPassword'),
          newPassword: fd.get('newPassword')
        })
      })
      .then(r => r.json())
      .then(d => alert(d.success ? 'Password updated!' : (d.error || 'Error')))
      .catch(() => alert('Error'));
    });
  }
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', function() {
  if (!checkAuth()) return;
  loadUserInfo();
  interceptForms();
  
  const path = window.location.pathname;
  if (path.includes('/admin/index.html') || path.includes('/admin/')) {
    loadBoxes();
  }
});
