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
  2:'<a href="/posting-options/index.html">Posting options</a><a href="/date-options/index.html">Date options</a><a href="/emoticons/index.html">Emoticons</a><a href="/filtering/index.html">Filtering</a>',
  3:'<a href="/registered-users/registered-users.html">Registered users</a><a href="/bans/index.html">Blocked users</a><a href="/user-integration/user-integration.html">User integration</a>',
  4:'<a href="#">Messages</a><a href="/archives/index.html">Archives</a><a href="/sticky-message/index.html">Sticky message</a><a href="/channels/index.html">Channels</a><a href="/webhook/index.html">Webhook</a>'
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

// ===== Archives Specific =====
function chk_fpostsarc(){
  var yy1=document.querySelector('input[name="yy1"]').value;
  var mm1=document.querySelector('input[name="mm1"]').value;
  var dd1=document.querySelector('input[name="dd1"]').value;
  var yy2=document.querySelector('input[name="yy2"]').value;
  var mm2=document.querySelector('input[name="mm2"]').value;
  var dd2=document.querySelector('input[name="dd2"]').value;
  
  if(!yy1||!mm1||!dd1||!yy2||!mm2||!dd2){
    alert('Please fill all date fields');
    return false;
  }
  
  var msg=document.getElementById('m_fpostsarc');
  if(msg){
    msg.textContent='✅ Archive generation started!';
    msg.className='frmmsg1 Okay';
    setTimeout(function(){msg.textContent='';},3000);
  }
  return false;
}

function downloadArchive(filename){
  alert('Downloading: '+filename+'\n\nIn production, this would download the archive file.');
}
