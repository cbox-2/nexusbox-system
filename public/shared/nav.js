// ===== NexusBox Navigation System - Fixed =====
(function() {
  'use strict';
  
  var menus = {
    1: [
      {text:'Layout', href:'/layout-options/layout-options.html'},
      {text:'Theme', href:'/Theme-editor/Theme-editor.html'},
      {text:'Emoticons', href:'/emoticons/index.html'}
    ],
    2: [
      {text:'Posting', href:'/posting-options/index.html'},
      {text:'Date', href:'/date-options/index.html'},
      {text:'Filtering', href:'/filtering/index.html'},
      {text:'Sticky Message', href:'/sticky-message/index.html'},
      {text:'Webhook', href:'/webhook/index.html'}
    ],
    3: [
      {text:'Registered Users', href:'/registered-users/registered-users.html'},
      {text:'User Integration', href:'/user-integration/user-integration.html'},
      {text:'Bans', href:'/bans/index.html'}
    ],
    4: [
      {text:'Messages', href:'/messages/index.html'},
      {text:'Archives', href:'/archives/index.html'},
      {text:'Chat', href:'/chat/chat.html'},
      {text:'Channels', href:'/channels/index.html'}
    ]
  };
  
  function openMenu(menuId) {
    var hovmenuDiv = document.getElementById('hovmenu');
    
    var items = menus[menuId] || [];
    hovmenuDiv.innerHTML = '';
    hovmenuDiv.style.display = 'block';
    
    items.forEach(function(item) {
      var a = document.createElement('a');
      a.href = item.href;
      a.className = 'submenuitem';
      a.textContent = item.text;
      hovmenuDiv.appendChild(a);
    });
    
    return false;
  }
  
  function closeMenu() {
    var hovmenuDiv = document.getElementById('hovmenu');
    if (hovmenuDiv) {
      hovmenuDiv.innerHTML = '';
      hovmenuDiv.style.display = 'none';
    }
  }
  
  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', function() {
    // Attach click handlers to all hovmenu buttons
    for (var i = 1; i <= 4; i++) {
      var btn = document.getElementById('hovmenu' + i);
      if (btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          openMenu(i);
          return false;
        });
        
        btn.addEventListener('mousedown', function(e) {
          e.preventDefault();
          openMenu(i);
          return false;
        });
      }
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      var subbar = document.getElementById('subbar');
      var bar3 = document.getElementById('bar3');
        closeMenu();
      }
    });
  });
  
  // Make hovmenu globally available
  window.hovmenu = openMenu;
})();

// Global functions
function globalLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login/index.html';
}

async function loadUserInfo() {
  var token = localStorage.getItem('token');
  try {
    var res = await fetch('/api/auth/me', {headers:{'Authorization':'Bearer '+token}});
    var data = await res.json();
    var uw = document.getElementById('userWelcome');
    var cn = document.getElementById('cbox-name');
    if (uw) uw.textContent = data.user.email || data.user.username;
    if (cn) cn.textContent = data.user.username.toUpperCase();
    return data.user;
  } catch(e) { console.error(e); return null; }
}
