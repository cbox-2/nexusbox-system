// ===== NexusBox Navigation System - Event Delegation =====
(function() {
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

  // Mapping by text content
  var textToMenu = {
    'Look & feel': 1,
    'Look &amp; feel': 1,
    'Look and feel': 1,
    'Options': 2,
    'Users': 3,
    'Messages': 4
  };

  function openMenu(menuId) {
    var hovmenuDiv = document.getElementById('hovmenu');
      console.warn('hovmenu div not found');
      return false;
    }
    var items = menus[menuId] || [];
    hovmenuDiv.innerHTML = '';
    hovmenuDiv.style.display = 'block';
    for (var i = 0; i < items.length; i++) {
      var a = document.createElement('a');
      a.href = items[i].href;
      a.className = 'submenuitem';
      a.textContent = items[i].text;
      hovmenuDiv.appendChild(a);
    }
    return false;
  }

  function closeMenu() {
    var hovmenuDiv = document.getElementById('hovmenu');
    if (hovmenuDiv) {
      hovmenuDiv.innerHTML = '';
      hovmenuDiv.style.display = 'none';
    }
  }

  // Event delegation on subbar
  function init() {
    var subbar = document.getElementById('subbar');
      console.warn('subbar not found');
      return;
    }

    subbar.addEventListener('mousedown', function(e) {
      var target = e.target;
      // Find the closest submenuitem
      while (target && target !== subbar) {
        if (target.classList && target.classList.contains('submenuitem')) break;
        target = target.parentElement;
      }

      var text = target.textContent.trim();
      var menuId = textToMenu[text];

      // Also check by ID
        var m = target.id.match(/hovmenu(\d)/);
        if (m) menuId = parseInt(m[1]);
      }

      if (menuId) {
        e.preventDefault();
        e.stopPropagation();
        openMenu(menuId);
        return false;
      }
    });

    subbar.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target !== subbar) {
        if (target.classList && target.classList.contains('submenuitem')) break;
        target = target.parentElement;
      }

      var text = target.textContent.trim();
      var menuId = textToMenu[text];

        var m = target.id.match(/hovmenu(\d)/);
        if (m) menuId = parseInt(m[1]);
      }

      if (menuId) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      var bar3 = document.getElementById('bar3');
        closeMenu();
      }
    });

    console.log('✅ Navigation system initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Global function
  window.hovmenu = openMenu;
})();

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
