/**
 * NexusBox Cbox Bridge v1.0
 * يربط واجهة Cbox الأصلية بـ APIs الحديثة
 * بدون تغيير حرف واحد في HTML
 */
(function() {
  'use strict';
  
  const API = window.location.origin;
  const TOKEN = localStorage.getItem('token');
  let currentBoxId = localStorage.getItem('currentBoxId') || '';
  let currentBox = null;
  let allBoxes = [];
  
  // ===== AUTH =====
  if (!TOKEN && !window.location.pathname.includes('/login.html') && !window.location.pathname.includes('/signup.html')) {
    window.location.href = '/login.html';
    return;
  }
  
  // ===== LOAD USER =====
  function loadUser() {
    if (!TOKEN) return;
    fetch(API + '/api/auth/me', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.user) {
          const el = document.getElementById('userWelcome');
          if (el) el.textContent = d.user.email;
        }
      });
  }
  
  // ===== LOAD BOXES =====
  function loadBoxes() {
    if (!TOKEN) return;
    fetch(API + '/api/boxes', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.boxes) {
          allBoxes = d.boxes;
          if (!currentBoxId && allBoxes.length > 0) {
            currentBoxId = allBoxes[0]._id;
            localStorage.setItem('currentBoxId', currentBoxId);
          }
          loadBoxData();
        }
      });
  }
  
  function loadBoxData() {
    if (!currentBoxId) return;
    fetch(API + '/api/boxes/' + currentBoxId, { headers: { 'Authorization': 'Bearer ' + TOKEN } })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.box) {
          currentBox = d.box;
          updateUI();
          populateForms();
        }
      });
  }
  
  function updateUI() {
    if (!currentBox) return;
    // تحديث عنوان القائمة
    const subbar = document.querySelector('#subbar .submenuitem b');
    if (subbar) subbar.textContent = currentBox.name.toUpperCase();
    
    // تحديث أي عنصر boxname
    document.querySelectorAll('.boxname').forEach(el => {
      el.textContent = currentBox.name;
    });
  }
  
  // ===== POPULATE FORMS =====
  function populateForms() {
    if (!currentBox) return;
    const box = currentBox;
    
    // settings form (Posting options)
    const settingsForm = document.forms['settings'];
    if (settingsForm) {
      if (settingsForm.mpl) settingsForm.mpl.value = box.settings?.messagesPerPage || 20;
      if (settingsForm.allowemail) settingsForm.allowemail.checked = box.settings?.allowEmail !== false;
      if (settingsForm.avatars) settingsForm.avatars.checked = box.posting?.avatars !== false;
      if (settingsForm.boxcode) settingsForm.boxcode.checked = box.posting?.boxCode !== false;
      if (settingsForm.showflag) settingsForm.showflag.checked = box.posting?.showFlag !== false;
      if (settingsForm.pm) settingsForm.pm.checked = box.posting?.pm || false;
      if (settingsForm.moderated) settingsForm.moderated.checked = box.posting?.moderated || false;
      if (settingsForm.mic) settingsForm.mic.checked = box.posting?.mic !== false;
      if (settingsForm.soundmute) settingsForm.soundmute.checked = box.posting?.soundMute || false;
      if (settingsForm.soundurl) settingsForm.soundurl.value = box.posting?.soundUrl || '';
      if (settingsForm.onliners_show) settingsForm.onliners_show.checked = box.posting?.onlineShow !== false;
      if (settingsForm.onliners_typing) settingsForm.onliners_typing.checked = box.posting?.onlineTyping !== false;
    }
    
    // dateopt form
    const dateForm = document.forms['dateopt'];
    if (dateForm) {
      if (dateForm.dformat) dateForm.dformat.value = box.dateSettings?.dateFormat || 'DD/MM/YYYY';
      if (dateForm.tformat) dateForm.tformat.value = box.dateSettings?.timeFormat || '24h';
      if (dateForm.tzone) dateForm.tzone.value = box.settings?.timezone || 'Asia/Baghdad';
    }
    
    // fsmilies form
    const smiliesForm = document.forms['fsmilies'];
    if (smiliesForm) {
      if (smiliesForm.smiliesopt) {
        smiliesForm.smiliesopt.value = box.emojiSettings?.enabled !== false ? '1' : '0';
      }
    }
    
    // ffilter form
    const filterForm = document.forms['ffilter'];
    if (filterForm) {
      if (filterForm.filter) filterForm.filter.checked = box.filterSettings?.enabled !== false;
      if (filterForm.htmlmode) filterForm.htmlmode.checked = box.filterSettings?.htmlMode || false;
      if (filterForm.wordsub) filterForm.wordsub.value = (box.filterSettings?.bannedWords || []).join('\n');
    }
    
    // styleadv form (Theme)
    const styleForm = document.forms['styleadv'];
    if (styleForm && styleForm.advancedcss) {
      styleForm.advancedcss.value = box.theme?.customCss || '';
    }
    
    // flayout form
    const layoutForm = document.forms['flayout'];
    if (layoutForm) {
      if (layoutForm.twidth) layoutForm.twidth.value = box.layout?.width || 400;
      if (layoutForm.theight) layoutForm.theight.value = box.layout?.height || 500;
      if (layoutForm.fheight) layoutForm.fheight.value = box.layout?.formHeight || 107;
      if (layoutForm.lang) layoutForm.lang.value = box.settings?.language || 'ar';
      if (layoutForm.mpp) layoutForm.mpp.value = box.settings?.messagesPerPage || 20;
      if (layoutForm.sortdir) layoutForm.sortdir.value = box.settings?.sortDirection || 1;
    }
    
    // fpostopt form (Webhook)
    const webhookForm = document.forms['fpostopt'];
    if (webhookForm) {
      if (webhookForm.url) webhookForm.url.value = box.webhook?.url || '';
      if (webhookForm.enabled) webhookForm.enabled.checked = box.webhook?.enabled || false;
    }
    
    // fsticky form
    const stickyForm = document.forms['fsticky'];
    if (stickyForm && stickyForm.sticky) {
      // Load sticky message
      fetch(API + '/api/boxes/' + currentBoxId + '/messages?sticky=true', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
        .then(r => r.json())
        .then(d => {
          if (d.success && d.messages && d.messages.length > 0) {
            stickyForm.sticky.value = d.messages[0].content;
          }
        });
    }
    
    // fuserint form
    const integrationForm = document.forms['fuserint'];
    if (integrationForm) {
      if (integrationForm.intwith) integrationForm.intwith.value = box.integration?.type || 'none';
      if (integrationForm.uo) integrationForm.uo.value = box.integration?.loginUrl || '';
      if (integrationForm.uoreg) integrationForm.uoreg.value = box.integration?.logoutUrl || '';
    }
    
    // fsnippet form (Publish)
    const snippetForm = document.forms['fsnippet'];
    if (snippetForm) {
      if (snippetForm.site) snippetForm.site.value = box.publish?.siteUrl || '';
      if (snippetForm.codessl) snippetForm.codessl.checked = box.publish?.sslEnabled !== false;
    }
  }
  
  // ===== INTERCEPT ALL FORMS =====
  function interceptForms() {
    document.querySelectorAll('form').forEach(form => {
      // تجاهل forms تسجيل الدخول الأصلية
      if (form.name === 'qlpop') return;
      
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!currentBoxId) {
          alert('No box selected. Please create a box first.');
          return;
        }
        
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
          if (form.elements[key] && form.elements[key].type === 'checkbox') {
            data[key] = form.elements[key].checked;
          } else {
            data[key] = value;
          }
        });
        
        handleFormSubmit(form.name, data);
      });
    });
  }
  
  function handleFormSubmit(formName, data) {
    if (!currentBoxId) return;
    
    let endpoint = '';
    let method = 'PUT';
    let body = data;
    let successMsg = 'Saved!';
    
    switch(formName) {
      case 'settings':
        endpoint = '/api/boxes/' + currentBoxId + '/settings';
        body = {
          messagesPerPage: parseInt(data.mpl) || 20,
          allowEmail: data.allowemail === '1' || data.allowemail === true,
          sortDirection: 1,
          language: 'ar',
          timezone: 'Asia/Baghdad'
        };
        // تحديث posting أيضاً
        fetch(API + '/api/boxes/' + currentBoxId, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            posting: {
              avatars: data.avatars === '1' || data.avatars === true,
              boxCode: data.boxcode === '1' || data.boxcode === true,
              showFlag: data.showflag === '1' || data.showflag === true,
              pm: data.pm === '1' || data.pm === true,
              moderated: data.moderated === '1' || data.moderated === true,
              mic: data.mic === '1' || data.mic === true,
              soundMute: data.soundmute === '1' || data.soundmute === true,
              soundUrl: data.soundurl || '',
              onlineShow: data.onliners_show === '1' || data.onliners_show === true,
              onlineTyping: data.onliners_typing === '1' || data.onliners_typing === true
            }
          })
        });
        break;
        
      case 'dateopt':
        endpoint = '/api/boxes/' + currentBoxId + '/date-settings';
        body = {
          dateFormat: data.dformat || 'DD/MM/YYYY',
          timeFormat: data.tformat || '24h'
        };
        break;
        
      case 'fsmilies':
        endpoint = '/api/boxes/' + currentBoxId + '/emoji-settings';
        body = {
          enabled: data.smiliesopt === '1' || data.smiliesopt === true
        };
        break;
        
      case 'ffilter':
        endpoint = '/api/boxes/' + currentBoxId + '/filter-settings';
        body = {
          enabled: data.filter === '1' || data.filter === true,
          htmlMode: data.htmlmode === '1' || data.htmlmode === true,
          bannedWords: (data.wordsub || '').split('\n').filter(x => x.trim())
        };
        break;
        
      case 'styleadv':
        endpoint = '/api/boxes/' + currentBoxId + '/theme';
        body = { customCss: data.advancedcss || '' };
        break;
        
      case 'flayout':
        endpoint = '/api/boxes/' + currentBoxId + '/layout';
        body = {
          width: parseInt(data.twidth) || 400,
          height: parseInt(data.theight) || 500,
          formHeight: parseInt(data.fheight) || 107
        };
        break;
        
      case 'fpostopt':
        endpoint = '/api/boxes/' + currentBoxId + '/webhook';
        body = {
          url: data.url || '',
          enabled: data.enabled === '1' || data.enabled === true
        };
        break;
        
      case 'fsticky':
        endpoint = '/api/boxes/' + currentBoxId + '/messages';
        method = 'POST';
        body = { content: data.sticky || '', isSticky: true };
        successMsg = 'Sticky message saved!';
        break;
        
      case 'fthreadadd':
        endpoint = '/api/boxes/' + currentBoxId + '/channels';
        method = 'POST';
        body = { name: data.nme || '', description: '' };
        successMsg = 'Channel added!';
        break;
        
      case 'fuseradd':
        endpoint = '/api/boxes/' + currentBoxId + '/users';
        method = 'POST';
        body = {
          username: data.uname || '',
          password: data.pword || '',
          level: parseInt(data.lvl) || 2
        };
        successMsg = 'User added!';
        break;
        
      case 'fban':
        endpoint = '/api/boxes/' + currentBoxId + '/bans';
        method = 'POST';
        body = {
          target: data.ip || '',
          reason: data.ref || '',
          duration: parseInt(data.dur) || 0
        };
        successMsg = 'User banned!';
        break;
        
      case 'fuserint':
        endpoint = '/api/boxes/' + currentBoxId + '/integration';
        body = {
          type: data.intwith || 'none',
          loginUrl: data.uo || '',
          logoutUrl: data.uoreg || ''
        };
        break;
        
      case 'fsnippet':
        endpoint = '/api/boxes/' + currentBoxId + '/publish';
        body = {
          siteUrl: data.site || '',
          sslEnabled: data.codessl === '1' || data.codessl === true
        };
        break;
        
      default:
        return;
    }
    
    fetch(API + endpoint, {
      method: method,
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(r => r.json())
    .then(d => {
      if (d.success) {
        alert(successMsg);
        if (method === 'POST') location.reload();
      } else {
        alert('Error: ' + (d.error || 'Unknown error'));
      }
    })
    .catch(err => alert('Network error'));
  }
  
  // ===== DELETE FUNCTIONS (global) =====
  window.deleteMessage = function(id) {
    if (!confirm('Delete this message?')) return;
    fetch(API + '/api/messages/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + TOKEN } })
      .then(r => r.json())
      .then(d => { if (d.success) location.reload(); });
  };
  
  window.deleteChannel = function(id) {
    if (!confirm('Delete this channel?')) return;
    fetch(API + '/api/channels/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + TOKEN } })
      .then(r => r.json())
      .then(d => { if (d.success) location.reload(); });
  };
  
  window.deleteUser = function(id) {
    if (!confirm('Delete this user?')) return;
    fetch(API + '/api/users/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + TOKEN } })
      .then(r => r.json())
      .then(d => { if (d.success) location.reload(); });
  };
  
  window.removeBan = function(id) {
    if (!confirm('Remove this ban?')) return;
    fetch(API + '/api/bans/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + TOKEN } })
      .then(r => r.json())
      .then(d => { if (d.success) location.reload(); });
  };
  
  window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentBoxId');
    window.location.href = '/';
  };
  
  // ===== INIT =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    loadUser();
    interceptForms();
    loadBoxes();
  }
})();
