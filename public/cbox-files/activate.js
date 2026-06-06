// NexusBox Activation Script - تفعيل جميع الوظائف
const API = window.location.origin;
const TOKEN = localStorage.getItem('token');

// التحقق من تسجيل الدخول
function checkAuth() {
  if (!TOKEN) {
    // السماح للزوار في الصفحة الرئيسية
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
      return true;
    }
    window.location.href = '/test.html';
    return false;
  }
  return true;
}

// تحميل معلومات المستخدم
function loadUserInfo() {
  if (!TOKEN) return;
  
  fetch(API + '/api/auth/me', { 
    headers: { 'Authorization': 'Bearer ' + TOKEN } 
  })
  .then(r => r.json())
  .then(d => {
    if (d.success && d.user) {
      const welcome = document.getElementById('userWelcome');
      if (welcome) welcome.textContent = d.user.email;
    }
  })
  .catch(() => {
    localStorage.removeItem('token');
    window.location.href = '/test.html';
  });
}

// تسجيل الخروج
function logout() {
  localStorage.removeItem('token');
  window.location.href = '/';
}

// تحميل الصناديق
function loadBoxes() {
  if (!TOKEN) return;
  
  fetch(API + '/api/boxes', { 
    headers: { 'Authorization': 'Bearer ' + TOKEN } 
  })
  .then(r => r.json())
  .then(d => {
    if (d.success && d.boxes) {
      // عرض في الجدول
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
      
      // عرض في القوائم المنسدلة
      const selects = document.querySelectorAll('select[name="boxid"]');
      selects.forEach(select => {
        select.innerHTML = '<option value="">-- Select --</option>';
        d.boxes.forEach(b => {
          select.innerHTML += `<option value="${b._id}">${b.name}</option>`;
        });
      });
    }
  });
}

// تحميل الرسائل
function loadMessages(boxId) {
  if (!TOKEN || !boxId) return;
  
  fetch(API + '/api/boxes/' + boxId + '/messages', { 
    headers: { 'Authorization': 'Bearer ' + TOKEN } 
  })
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

// حذف رسالة
function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  
  fetch(API + '/api/messages/' + id, { 
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + TOKEN } 
  })
  .then(r => r.json())
  .then(d => {
    if (d.success) location.reload();
  });
}

// تحميل المستخدمين
function loadUsers(boxId) {
  if (!TOKEN || !boxId) return;
  
  fetch(API + '/api/boxes/' + boxId + '/users', { 
    headers: { 'Authorization': 'Bearer ' + TOKEN } 
  })
  .then(r => r.json())
  .then(d => {
    if (d.success && d.users) {
      const table = document.querySelector('table');
      if (table) {
        let html = '<thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead><tbody>';
        d.users.forEach(u => {
          html += `<tr>
            <td>${u.username}</td>
            <td>${u.email}</td>
            <td>${u.role}</td>
            <td>
              <input type="button" value="Edit" onclick="editUser('${u._id}')">
              <input type="button" value="Ban" onclick="banUser('${u._id}')" class="Danger">
            </td>
          </tr>`;
        });
        html += '</tbody>';
        table.innerHTML = html;
      }
    }
  });
}

// تفعيل النماذج
function activateForms() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    const action = form.getAttribute('action');
    
    // تحويل actions إلى API المحلي
    if (action && action.includes('/admin_d_')) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        let endpoint = '';
        let method = 'POST';
        
        // تحديد الـ endpoint بناءً على الـ action
        if (action.includes('login')) endpoint = '/api/auth/login';
        else if (action.includes('logout')) endpoint = '/api/auth/logout';
        else if (action.includes('box')) endpoint = '/api/boxes';
        else if (action.includes('message')) endpoint = '/api/messages';
        else if (action.includes('user')) endpoint = '/api/users';
        else if (action.includes('settings')) endpoint = '/api/settings';
        else endpoint = action.replace('/admin_d_', '/api/');
        
        fetch(API + endpoint, {
          method: method,
          headers: { 
            'Authorization': 'Bearer ' + TOKEN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            showMessage(form, 'Success!', 'Okay');
            setTimeout(() => location.reload(), 1000);
          } else {
            showMessage(form, d.message || 'Error', 'Error');
          }
        })
        .catch(() => showMessage(form, 'Network error', 'Error'));
      });
    }
  });
}

// عرض رسالة
function showMessage(form, msg, type) {
  const msgDiv = form.querySelector('.frmmsg1');
  if (msgDiv) {
    msgDiv.textContent = msg;
    msgDiv.className = 'frmmsg1 ' + (type === 'Okay' ? 'Okay' : 'Error');
    setTimeout(() => {
      msgDiv.textContent = '';
      msgDiv.className = 'frmmsg1';
    }, 3000);
  }
}

// تفعيل الأزرار
function activateButtons() {
  const buttons = document.querySelectorAll('input[type="button"], input[type="submit"], a.button');
  
  buttons.forEach(btn => {
    if (btn.onclick) return; // تخطي إذا كان له onclick بالفعل
    
    const text = btn.value || btn.textContent;
    
    if (text.includes('Delete') || text.includes('Remove')) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const id = this.dataset.id || this.getAttribute('data-id');
        if (id) deleteMessage(id);
      });
    }
  });
}

// التهيئة عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', function() {
  if (!checkAuth()) return;
  
  loadUserInfo();
  
  // تحميل البيانات حسب الصفحة
  const path = window.location.pathname;
  
  if (path.includes('/admin/index.html')) {
    loadBoxes();
  } else if (path.includes('/admin/messages')) {
    const params = new URLSearchParams(window.location.search);
    const boxId = params.get('box') || localStorage.getItem('currentBoxId');
    if (boxId) loadMessages(boxId);
  } else if (path.includes('/admin/users')) {
    const params = new URLSearchParams(window.location.search);
    const boxId = params.get('box') || localStorage.getItem('currentBoxId');
    if (boxId) loadUsers(boxId);
  }
  
  activateForms();
  activateButtons();
});
