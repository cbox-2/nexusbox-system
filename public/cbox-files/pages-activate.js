// NexusBox Pages Activation Script - يتعامل مع بنية Cbox الأصلية
const API = window.location.origin;
const TOKEN = localStorage.getItem('token');
let currentBoxId = localStorage.getItem('currentBoxId');

// ===== AUTH CHECK =====
function checkAuth() {
  if (!TOKEN) {
    if (window.location.pathname.includes('/login.html')) return;
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// ===== LOAD USER INFO =====
function loadUserInfo() {
  if (!TOKEN) return;
  fetch(API + '/api/auth/me', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.user) {
        const w = document.getElementById('userWelcome');
        if (w) w.textContent = d.user.email;
      }
    });
}

// ===== LOAD BOXES =====
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
        loadCurrentBox();
      }
    });
}

function loadCurrentBox() {
  if (!currentBoxId) return;
  fetch(API + '/api/boxes/' + currentBoxId, { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.box) {
        window.currentBoxData = d.box;
        populatePage();
      }
    });
}

// ===== POPULATE PAGE DATA =====
function populatePage() {
  const box = window.currentBoxData;
  if (!box) return;
  const path = window.location.pathname;
  
  // Options page
  if (path.includes('options.html') && !path.includes('options-')) {
    const f = document.forms['settings'];
    if (f) {
      if (f.mpl) f.mpl.value = box.settings?.messagesPerPage || 20;
      if (f.allowemail) f.allowemail.checked = box.settings?.allowEmail !== false;
      if (f.avatars) f.avatars.checked = box.posting?.avatars !== false;
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
      if (f.dformat) f.dformat.value = box.dateSettings?.dateFormat || 'DD/MM/YYYY';
      if (f.tformat) f.tformat.value = box.dateSettings?.timeFormat || '24h';
    }
  }
  
  // Emoji options
  if (path.includes('options-emoji.html')) {
    // Complex page - handle separately
  }
  
  // Filter options
  if (path.includes('options-filter.html')) {
    const f = document.forms['ffilter'];
    if (f) {
      if (f.filter) f.filter.checked = box.filterSettings?.enabled !== false;
      if (f.wordsub) f.wordsub.value = (box.filterSettings?.bannedWords || []).join('\n');
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
      if (f.twidth) f.twidth.value = box.layout?.width || 400;
      if (f.theight) f.theight.value = box.layout?.height || 500;
      if (f.fheight) f.fheight.value = box.layout?.formHeight || 107;
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

// ===== INTERCEPT ALL FORMS =====
function interceptForms() {
  // Settings form (options.html)
  const settingsForm = document.forms['settings'];
  if (settingsForm) {
    settingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      const settings = {
        messagesPerPage: parseInt(this.mpl?.value) || 20,
        allowEmail: this.allowemail?.checked || false,
        sortDirection: 1,
        language: 'ar',
        timezone: 'Asia/Baghdad'
      };
      const posting = {
        avatars: this.avatars?.checked || false,
        boxCode: this.boxcode?.checked || false,
        pm: this.pm?.checked || false,
        moderated: this.moderated?.checked || false,
        mic: this.mic?.checked || false
      };
      Promise.all([
        fetch(API + '/api/boxes/' + currentBoxId + '/settings', {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        }),
        fetch(API + '/api/boxes/' + currentBoxId, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ posting })
        })
      ]).then(() => alert('Settings saved!')).catch(() => alert('Error saving'));
    });
  }
  
  // Date options form
  const dateForm = document.forms['dateopt'];
  if (dateForm) {
    dateForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      fetch(API + '/api/boxes/' + currentBoxId + '/date-settings', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateFormat: this.dformat?.value || 'DD/MM/YYYY',
          timeFormat: this.tformat?.value || '24h'
        })
      }).then(() => alert('Date settings saved!')).catch(() => alert('Error saving'));
    });
  }
  
  // Filter form
  const filterForm = document.forms['ffilter'];
  if (filterForm) {
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      fetch(API + '/api/boxes/' + currentBoxId + '/filter-settings', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: this.filter?.checked || false,
          bannedWords: (this.wordsub?.value || '').split('\n').filter(x => x.trim())
        })
      }).then(() => alert('Filter settings saved!')).catch(() => alert('Error saving'));
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
          width: parseInt(this.twidth?.value) || 400,
          height: parseInt(this.theight?.value) || 500,
          formHeight: parseInt(this.fheight?.value) || 107
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
  
  // Sticky message form
  const stickyForm = document.forms['fsticky'];
  if (stickyForm) {
    stickyForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      // Save as sticky message
      fetch(API + '/api/boxes/' + currentBoxId + '/messages', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: this.sticky?.value || '',
          isSticky: true
        })
      }).then(() => alert('Sticky message saved!')).catch(() => alert('Error saving'));
    });
  }
  
  // Channel add form
  const channelForm = document.forms['fthreadadd'];
  if (channelForm) {
    channelForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      fetch(API + '/api/boxes/' + currentBoxId + '/channels', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.nme?.value || '',
          description: ''
        })
      }).then(() => { alert('Channel added!'); location.reload(); }).catch(() => alert('Error adding'));
    });
  }
  
  // User add form
  const userForm = document.forms['fuseradd'];
  if (userForm) {
    userForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      fetch(API + '/api/boxes/' + currentBoxId + '/users', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.uname?.value || '',
          password: this.pword?.value || '',
          level: parseInt(this.lvl?.value) || 2
        })
      }).then(() => { alert('User added!'); location.reload(); }).catch(() => alert('Error adding'));
    });
  }
  
  // Ban form
  const banForm = document.forms['fban'];
  if (banForm) {
    banForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      fetch(API + '/api/boxes/' + currentBoxId + '/bans', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: this.ip?.value || '',
          reason: this.ref?.value || '',
          duration: parseInt(this.dur?.value) || 0
        })
      }).then(() => { alert('User banned!'); location.reload(); }).catch(() => alert('Error banning'));
    });
  }
  
  // User integration form
  const integrationForm = document.forms['fuserint'];
  if (integrationForm) {
    integrationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentBoxId) return alert('No box selected');
      fetch(API + '/api/boxes/' + currentBoxId + '/integration', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: this.intwith?.value || 'none',
          loginUrl: this.uo?.value || '',
          logoutUrl: this.uoreg?.value || ''
        })
      }).then(() => alert('Integration saved!')).catch(() => alert('Error saving'));
    });
  }
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', function() {
  if (!checkAuth()) return;
  loadUserInfo();
  interceptForms();
  
  const path = window.location.pathname;
  if (path.includes('/admin/')) {
    loadBoxes();
  }
});
