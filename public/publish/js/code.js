// NexusBox Publish Page - Menu & Utilities
var menuon = false;
var curmnu = null;

// بيانات القوائم المنسدلة الأصلية
var mnuData = {
  1: ['Layout options', 'Theme editor', 'Custom CSS'],
  2: ['Posting options', 'Date options', 'Emoticons', 'Filtering'],
  3: ['Registered users', 'Blocked users', 'User integration'],
  4: ['Messages', 'Archives', 'Sticky message', 'Channels', 'Webhook']
};

function hovmenu(el, id) {
  var menu = document.getElementById('hovmenu');
  if (!menu) return;
  var html = '';
  (mnuData[id] || []).forEach(item => {
    html += `<a href="#">${item}</a>`;
  });
  menu.innerHTML = html;
  var rect = el.getBoundingClientRect();
  menu.style.left = rect.left + 'px';
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.display = 'block';
  curmnu = id;
}

function togglemenu() {
  var menu = document.getElementById('hovmenu');
  if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// إخفاء القائمة عند الضغط خارجها
document.addEventListener('click', function(e) {
  if (!e.target.closest('.submenuitem') && !e.target.closest('#hovmenu')) {
    var menu = document.getElementById('hovmenu');
    if (menu) menu.style.display = 'none';
  }
});