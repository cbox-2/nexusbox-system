// NexusBox Activation Script v3.0 - ربط جميع الصفحات بـ APIs
const API = window.location.origin;
const TOKEN = localStorage.getItem('token');

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
      }
    })
    .catch(() => { localStorage.removeItem('token'); });
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
      if (d.success && d.boxes) {
        const table = document.querySelector('table');
        if (table && window.location.pathname.includes('/admin/index.html')) {
          let html = '<thead><tr><th>Name</th><th>Slug</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
          d.boxes.forEach(b => {
            html += `<tr>
              <td>${b.name}</td>
              <td>${b.slug}</td>
              <td>${b.status}</td>
              <td>
                <a href="/admin/messages.html?box=${b._id}" class="button">Manage</a>
                <a href="/admin/publish.html?key=${b.embedKey}" class="button">Publish</a>
              </td>
            </tr>`;
          });
          html += '</tbody>';
          table.innerHTML = html;
        }
        const selects = document.querySelectorAll('select[name="boxid"]');
        selects.forEach(s => {
          s.innerHTML = '<option value="">-- Select --</option>';
          d.boxes.forEach(b => { s.innerHTML += `<option value="${b._id}">${b.name}</option>`; });
        });
      }
    });
}

function getCurrentBoxId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('box') || localStorage.getItem('currentBoxId');
}

// ===== MESSAGES =====
function loadMessages(boxId) {
  if (!TOKEN || !boxId) return;
  localStorage.setItem('currentBoxId', boxId);
  fetch(API + '/api/boxes/' + boxId + '/messages', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.messages) {
        const table = document.querySelector('table');
        if (table) {
          let html = '<thead><tr><th>Message</th><th>Author</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
          d.messages.forEach(m => {
            html += `<tr>
              <td>${m.content.substring(0, 100)}</td>
              <td>${m.author?.username || 'Guest'}</td>
              <td>${new Date(m.createdAt).toLocaleString()}</td>
              <td><input type="button" value="Delete" onclick="deleteMessage('${m._id}')" class="Danger"></td>
            </tr>`;
          });
          html += '</tbody>';
          table.innerHTML = html;
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

function loadStickyMessages(boxId) {
  if (!TOKEN || !boxId) return;
  fetch(API + '/api/boxes/' + boxId + '/messages?sticky=true', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.messages) {
        const table = document.querySelector('table');
        if (table) {
          let html = '<thead><tr><th>Message</th><th>Author</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
          d.messages.forEach(m => {
            html += `<tr>
              <td>${m.content}</td>
              <td>${m.author?.username || 'Guest'}</td>
              <td>${new Date(m.createdAt).toLocaleString()}</td>
              <td><input type="button" value="Delete" onclick="deleteMessage('${m._id}')" class="Danger"></td>
            </tr>`;
          });
          html += '</tbody>';
          table.innerHTML = html;
        }
      }
    });
}

function loadArchivedMessages(boxId) {
  if (!TOKEN || !boxId) return;
  fetch(API + '/api/boxes/' + boxId + '/messages?archived=true', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.messages) {
        const table = document.querySelector('table');
        if (table) {
          let html = '<thead><tr><th>Message</th><th>Author</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
          d.messages.forEach(m => {
            html += `<tr>
              <td>${m.content}</td>
              <td>${m.author?.username || 'Guest'}</td>
              <td>${new Date(m.createdAt).toLocaleString()}</td>
              <td><input type="button" value="Delete" onclick="deleteMessage('${m._id}')" class="Danger"></td>
            </tr>`;
          });
          html += '</tbody>';
          table.innerHTML = html;
        }
      }
    });
}

// ===== USERS =====
function loadUsers(boxId) {
  if (!TOKEN || !boxId) return;
  fetch(API + '/api/boxes/' + boxId + '/users', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.users) {
        const table = document.querySelector('table');
        if (table) {
          let html = '<thead><tr><th>Username</th><th>Email</th><th>Level</th><th>Actions</th></tr></thead><tbody>';
          d.users.forEach(u => {
            html += `<tr>
              <td>${u.username}</td>
              <td>${u.email || '-'}</td>
              <td>${u.level}</td>
              <td>
                <input type="button" value="Edit" onclick="editUser('${u._id}')">
                <input type="button" value="Delete" onclick="deleteUser('${u._id}')" class="Danger">
              </td>
            </tr>`;
          });
          html += '</tbody>';
          table.innerHTML = html;
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

function loadBannedUsers(boxId) {
  if (!TOKEN || !boxId) return;
  fetch(API + '/api/boxes/' + boxId + '/bans', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.bans) {
        const table = document.querySelector('table');
        if (table) {
          let html = '<thead><tr><th>Target</th><th>Reason</th><th>Duration</th><th>Actions</th></tr></thead><tbody>';
          d.bans.forEach(b => {
            html += `<tr>
              <td>${b.target}</td>
              <td>${b.reason || '-'}</td>
              <td>${b.duration > 0 ? b.duration + ' hours' : 'Permanent'}</td>
              <td><input type="button" value="Remove" onclick="removeBan('${b._id}')" class="Danger"></td>
            </tr>`;
          });
          html += '</tbody>';
          table.innerHTML = html;
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

// ===== CHANNELS =====
function loadChannels(boxId) {
  if (!TOKEN || !boxId) return;
  fetch(API + '/api/boxes/' + boxId + '/channels', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.channels) {
        const table = document.querySelector('table');
        if (table) {
          let html = '<thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead><tbody>';
          d.channels.forEach(c => {
            html += `<tr>
              <td>${c.name}</td>
              <td>${c.description || '-'}</td>
              <td><input type="button" value="Delete" onclick="deleteChannel('${c._id}')" class="Danger"></td>
            </tr>`;
          });
          html += '</tbody>';
          table.innerHTML = html;
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

// ===== SETTINGS =====
function loadBoxSettings(boxId) {
  if (!TOKEN || !boxId) return;
  fetch(API + '/api/boxes/' + boxId, { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(d => {
      if (d.success && d.box) {
        const box = d.box;
        // Options
        if (box.settings) {
          Object.keys(box.settings).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
              if (input.type === 'checkbox') input.checked = box.settings[key];
              else input.value = box.settings[key];
            }
          });
        }
        // Date settings
        if (box.dateSettings) {
          Object.keys(box.dateSettings).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
              if (input.type === 'checkbox') input.checked = box.dateSettings[key];
              else input.value = box.dateSettings[key];
            }
          });
        }
        // Emoji settings
        if (box.emojiSettings) {
          const enabled = document.querySelector('[name="emojiEnabled"]');
          if (enabled) enabled.checked = box.emojiSettings.enabled;
          const allowed = document.querySelector('[name="allowedEmojis"]');
          if (allowed) allowed.value = box.emojiSettings.allowed.join(',');
        }
        // Filter settings
        if (box.filterSettings) {
          const enabled = document.querySelector('[name="filterEnabled"]');
          if (enabled) enabled.checked = box.filterSettings.enabled;
          const banned = document.querySelector('[name="bannedWords"]');
          if (banned) banned.value = box.filterSettings.bannedWords.join(',');
        }
        // Theme
        if (box.theme) {
          Object.keys(box.theme).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) input.value = box.theme[key];
          });
        }
        // Layout
        if (box.layout) {
          Object.keys(box.layout).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
              if (input.type === 'checkbox') input.checked = box.layout[key];
              else input.value = box.layout[key];
            }
          });
        }
        // Webhook
        if (box.webhook) {
          const url = document.querySelector('[name="webhookUrl"]');
          if (url) url.value = box.webhook.url;
          const enabled = document.querySelector('[name="webhookEnabled"]');
          if (enabled) enabled.checked = box.webhook.enabled;
        }
      }
    });
}

function saveSettings(boxId, endpoint, data) {
  if (!TOKEN || !boxId) return;
  fetch(API + '/api/boxes/' + boxId + '/' + endpoint, {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(r => r.json())
  .then(d => {
    if (d.success) {
      showMessage(null, 'Settings saved!', 'Okay');
    } else {
      showMessage(null, d.error || 'Error saving settings', 'Error');
    }
  })
  .catch(() => showMessage(null, 'Network error', 'Error'));
}

// ===== ACCOUNT =====
function changePassword() {
  const currentPassword = document.querySelector('[name="currentPassword"]')?.value;
  const newPassword = document.querySelector('[name="newPassword"]')?.value;
  if (!currentPassword || !newPassword) {
    showMessage(null, 'All fields required', 'Error');
    return;
  }
  fetch(API + '/api/auth/change-password', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  })
  .then(r => r.json())
  .then(d => {
    if (d.success) {
      showMessage(null, 'Password updated!', 'Okay');
    } else {
      showMessage(null, d.error || 'Error', 'Error');
    }
  });
}

// ===== SUPPORT =====
function submitBugReport() {
  const subject = document.querySelector('[name="subject"]')?.value;
  const description = document.querySelector('[name="description"]')?.value;
  if (!subject || !description) {
    showMessage(null, 'All fields required', 'Error');
    return;
  }
  fetch(API + '/api/support/bug-report', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, description })
  })
  .then(r => r.json())
  .then(d => {
    if (d.success) {
      showMessage(null, 'Report submitted!', 'Okay');
    } else {
      showMessage(null, d.error || 'Error', 'Error');
    }
  });
}

// ===== UTILS =====
function showMessage(form, msg, type) {
  const msgDiv = form?.querySelector('.frmmsg1') || document.querySelector('.frmmsg1');
  if (msgDiv) {
    msgDiv.textContent = msg;
    msgDiv.className = 'frmmsg1 ' + (type === 'Okay' ? 'Okay' : 'Error');
    setTimeout(() => { msgDiv.textContent = ''; msgDiv.className = 'frmmsg1'; }, 3000);
  }
}

function activateForms() {
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      const boxId = getCurrentBoxId();
      const path = window.location.pathname;
      
      if (path.includes('options.html')) saveSettings(boxId, 'settings', data);
      else if (path.includes('options-date.html')) saveSettings(boxId, 'date-settings', data);
      else if (path.includes('options-emoji.html')) saveSettings(boxId, 'emoji-settings', data);
      else if (path.includes('options-filter.html')) saveSettings(boxId, 'filter-settings', data);
      else if (path.includes('lookfeel-layout.html')) saveSettings(boxId, 'layout', data);
      else if (path.includes('lookfeel.html')) saveSettings(boxId, 'theme', data);
      else if (path.includes('webhook.html')) saveSettings(boxId, 'webhook', data);
      else if (path.includes('account.html')) changePassword();
      else if (path.includes('support.html')) submitBugReport();
    });
  });
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', function() {
  if (!checkAuth()) return;
  loadUserInfo();
  const path = window.location.pathname;
  const boxId = getCurrentBoxId();
  
  if (path.includes('/admin/index.html')) loadBoxes();
  else if (path.includes('messages-sticky.html')) loadStickyMessages(boxId);
  else if (path.includes('messages-archive.html')) loadArchivedMessages(boxId);
  else if (path.includes('messages.html')) loadMessages(boxId);
  else if (path.includes('users-banned.html')) loadBannedUsers(boxId);
  else if (path.includes('users.html')) loadUsers(boxId);
  else if (path.includes('messages-channels.html')) loadChannels(boxId);
  else if (path.includes('options') || path.includes('lookfeel') || path.includes('webhook')) loadBoxSettings(boxId);
  
  activateForms();
});
