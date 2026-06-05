// ===== NexusBox Navigation System v4 - Fixed =====
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
      // Prevent default and navigate
      link.onclick = function(e) {
        e.preventDefault();
        window.location.href = item.href;
        return false;
      };
      container.appendChild(link);
    });
    
    return false;
  }

  function hideMenu() {
    var container = document.getElementById('hovmenu');
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
  }

  function init() {
    console.log('🚀 Navigation system v4 initializing...');
    
    var subbar = document.getElementById('subbar');
    if (!subbar) {
      console.error('❌ subbar not found');
      return;
    }

    // Get current page path
    var currentPath = window.location.pathname;
    console.log('Current path:', currentPath);

    // Handle all clicks in subbar
    subbar.addEventListener('click', function(e) {
      var target = e.target;
      
      // Find closest submenuitem
      while (target && target !== subbar) {
        if (target.classList && target.classList.contains('submenuitem')) {
          break;
        }
        target = target.parentElement;
      }
      
      if (!target || target === subbar) return;
      
      // Check if it's a dropdown button (hovmenu1-4)
      var btnId = target.id;
      if (btnId && btnId.startsWith('hovmenu')) {
        var menuId = parseInt(btnId.replace('hovmenu', ''));
        if (menuId >= 1 && menuId <= 4) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Opening menu', menuId);
          showMenu(menuId);
          return false;
        }
      }
      
      // For regular links (Publish, Dashboard, etc), let them navigate
      var href = target.getAttribute('href');
      if (href && href !== '#' && !href.startsWith('javascript')) {
        console.log('Navigating to:', href);
        // Don't prevent default - let the link work normally
        return true;
      }
      
      e.preventDefault();
      return false;
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      var subbar = document.getElementById('subbar');
      var bar3 = document.getElementById('bar3');
      if (subbar && bar3 && !subbar.contains(e.target) && !bar3.contains(e.target)) {
        hideMenu();
      }
    });

    // Set active state
    var allLinks = subbar.querySelectorAll('.submenuitem');
    allLinks.forEach(function(link) {
      link.classList.remove('active');
      var href = link.getAttribute('href');
      if (href && currentPath.includes(href)) {
        link.classList.add('active');
        console.log('Active:', href);
      }
    });

    console.log('✅ Navigation system v4 ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
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
    console.error('Error loading user:', e);
    return null;
  }
}
