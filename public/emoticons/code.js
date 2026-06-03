// ===== Global Functions =====
function globalLogout(){
  if(confirm('Log out of NexusBox?')){
    localStorage.clear();
    location.href='/signup/signup.html';
  }
}

// ===== Dropdown Menu =====
var mnucont={
  1:'<a href="/Theme-editor/Theme-editor.html">Theme editor</a><a href="/layout-options/layout-options.html">Layout options</a>',
  2:'<a href="/posting-options/index.html">Posting options</a><a href="/date-options/index.html">Date options</a><a href="/emoticons/index.html">Emoticons</a><a href="#">Filtering</a>',
  3:'<a href="/registered-users/registered-users.html">Registered users</a><a href="/bans/index.html">Blocked users</a><a href="/user-integration/user-integration.html">User integration</a>',
  4:'<a href="#">Messages</a><a href="#">Archives</a><a href="#">Sticky message</a><a href="#">Channels</a>'
};

function hovmenu(o,m){
  var h=document.getElementById('hovmenu');
  if(!h)return false;
  h.innerHTML=mnucont[m]||'';
  h.style.display='flex';
  var r=o.getBoundingClientRect();
  h.style.top=(r.bottom+4)+'px';
  h.style.left=Math.min(r.left,window.innerWidth-h.offsetWidth-10)+'px';
  return false;
}

// Close dropdown when clicking outside
document.addEventListener('click',function(e){
  var h=document.getElementById('hovmenu');
  if(h&&h.style.display==='flex'){
    if(!e.target.closest('.submenuitem')&&!e.target.closest('#hovmenu')){
      h.style.display='none';
    }
  }
});

// ===== User Welcome =====
document.addEventListener('DOMContentLoaded',function(){
  var e=localStorage.getItem('nb_user_email');
  if(e)document.getElementById('userWelcome').textContent=e;
});

// ===== Emoticons Specific =====
function popwin(id, page, w, h) {
  window.open(page, id, 'width='+w+',height='+h+',toolbar=no,status=no,resizable=yes,scrollbars=yes');
}
