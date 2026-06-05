// ===== NexusBox Navigation System v3 - Event Delegation =====
(function() {
  'use strict';
  
  // Menu definitions
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

  // Show menu
  function showMenu(menuId) {
    var container = document.getElementById('hovmenu');
    if (!container) return false;
    
    var items = menus[menuId];
    if (!items) return false;
    
    container.innerHTML = '';
    container.style.display = 'block';
    
    items.forEach(function(item) {
      var link = document.createElement('a');
      link.href = item.href;
      link.className = 'submenuitem';
      link.textContent = item.text;
      container.appendChild(link);
    });
    
    return false;
  }

  // Hide menu
  function hideMenu() {
    var container = document.getElementById('hovmenu');
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
  }

  // Initialize navigation
  function init() {
    console.log('🚀 Navigation system initializing...');
    
    var subbar = document.getElementById('subbar');
    if (!subbar) {
      console.error('❌ subbar not found');
      return;
    }

    // Event delegation on subbar
    subbar.addEventListener('click', function(e) {
      var target = e.target.closest('.submenuitem');
      if (!target) return;
      
      var id = target.id;
      if (id && id.startsWith('hovmenu')) {
        var menuId = parseInt(id.replace('hovmenu', ''));
        if (menuId >= 1 && menuId <= 4) {
          e.preventDefault();
          e.stopPropagation();
          showMenu(menuId);
          return false;
        }
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      var subbar = document.getElementById('subbar');
      var bar3 = document.getElementById('bar3');
      if (subbar && bar3 && !subbar.contains(e.target) && !bar3.contains(e.target)) {
        hideMenu();
      }
    });

    // Set active state for current page
    var currentPath = window.location.pathname;
    var allLinks = subbar.querySelectorAll('.submenuitem');
    allLinks.forEach(function(link) {
      if (link.href && link.href.endsWith(currentPath)) {
        link.classList.add('active');
      }
    });

    console.log('✅ Navigation system ready');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Global function
  window.hovmenu = showMenu;
})();

// Global logout
function globalLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login/index.html';
}

// Load user info
async function loadUserInfo() {
  var token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login/index.html';
    return null;
  }
  try {
    var res = await fetch('/api/auth/me', {
      headers: {'Authorization': 'Bearer ' + token}
    });
    var data = await res.json();
    if (!data.success) {
      localStorage.removeItem('token');
      window.location.href = '/login/index.html';
      return null;
    }
    var uw = document.getElementById('userWelcome');
    var cn = document.getElementById('cbox-name');
    if (uw) uw.textContent = data.user.email || data.user.username;
    if (cn) cn.textContent = data.user.username.toUpperCase();
    return data.user;
  } catch(e) {
    console.error('Error loading user:', e);
    return null;
  }
}
