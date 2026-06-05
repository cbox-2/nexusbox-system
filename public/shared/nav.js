// ===== NexusBox Navigation System - Final Clean =====
(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.navInitialized) return;
  window.navInitialized = true;
  
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

  function showMenu(menuId) {
    var container = document.getElementById('hovmenu');
    if (!container) return false;
    
    var items = menus[menuId];
    if (!items) return false;
    
    container.innerHTML = '';
    container.style.display = 'flex';
    
    for (var i = 0; i < items.length; i++) {
      var link = document.createElement('a');
      link.href = items[i].href;
      link.className = 'submenuitem';
      link.textContent = items[i].text;
      container.appendChild(link);
    }
    
    return false;
  }

  function hideMenu() {
    var container = document.getElementById('hovmenu');
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
  }

  // Initialize ONCE
  function init() {
    var subbar = document.getElementById('subbar');
    if (!subbar) return;

    // Single event listener
    subbar.addEventListener('click', function(e) {
      var target = e.target;
      
      while (target && target !== subbar) {
        if (target.classList && target.classList.contains('submenuitem')) break;
        target = target.parentElement;
      }
      
      if (!target || target === subbar) return;
      
      var id = target.id || '';
      var match = id.match(/^hovmenu(\d)$/);
      
      if (match) {
        e.preventDefault();
        e.stopPropagation();
        var menuId = parseInt(match[1]);
        showMenu(menuId);
        return false;
      }
      
      var href = target.getAttribute('href');
      if (href && href !== '#' && href.indexOf('javascript') !== 0) {
        return true;
      }
      
      e.preventDefault();
      return false;
    }, { once: false });

    // Close menu on outside click
    document.addEventListener('click', function(e) {
      var subbar = document.getElementById('subbar');
      var bar3 = document.getElementById('bar3');
      if (subbar && bar3 && !subbar.contains(e.target) && !bar3.contains(e.target)) {
        hideMenu();
      }
    });

    // Active state
    var currentPath = window.location.pathname;
    var allLinks = subbar.querySelectorAll('.submenuitem');
    for (var i = 0; i < allLinks.length; i++) {
      var link = allLinks[i];
      var href = link.getAttribute('href');
      if (href && currentPath.indexOf(href) !== -1 && href !== '#') {
        link.classList.add('active');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  
  window.hovmenu = showMenu;
})();

function globalLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login/index.html';
}

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
    console.error('Error:', e);
    return null;
  }
}

// Ensure globalLogout is available
if (typeof window.globalLogout !== 'function') {
  window.globalLogout = function() {
    console.log('[Logout] Clearing session...');
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      console.log('[Logout] Session cleared');
      window.location.href = '/login/index.html';
    } catch(e) {
      console.error('[Logout] Error:', e);
      window.location.href = '/login/index.html';
    }
    return false;
  };
}
