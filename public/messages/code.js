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
  4:'<a href="/messages/index.html">Messages</a><a href="/archives/index.html">Archives</a><a href="/sticky-message/index.html">Sticky message</a><a href="/channels/index.html">Channels</a><a href="/webhook/index.html">Webhook</a>'
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

// ===== Messages Specific =====
function chk_fpostopt(){
  var msg=document.getElementById('m_fpostopt');
  if(msg){
    msg.textContent='✅ Settings saved!';
    msg.className='frmmsg1 Okay';
    setTimeout(function(){msg.textContent='';},3000);
  }
  return false;
}

function chk_bulkdel(){
  var prunetype=document.querySelector('select[name="prunetype"]');
  var prunenum=document.querySelector('input[name="prunenum"]');
  var prunewhich=document.querySelector('select[name="prunewhich"]');
  
  var a=(prunetype.value=="1")?'delete':'keep';
  var b=(prunewhich.value=="1")?'newest':'oldest';
  var c=prunenum.value;
  
  if(confirm("You have specified to "+a+" the "+c+" "+b+" messages from your NexusBox. Are you sure?")){
    var msg=document.getElementById('m_fquickdel');
    if(msg){
      msg.textContent='✅ '+c+' messages '+a+'d!';
      msg.className='frmmsg1 Okay';
      setTimeout(function(){msg.textContent='';},3000);
    }
  }
  return false;
}

function toggleSearch(){
  var s=document.getElementById('srchposts');
  if(s)s.style.display=s.style.display==='none'?'table-row':'none';
}

function selectAllMessages(){
  document.querySelectorAll('.msg-check').forEach(function(c){c.checked=!c.checked;});
}

function deleteSelected(){
  var checked=document.querySelectorAll('.msg-check:checked');
  if(checked.length===0){
    alert('No messages selected');
    return;
  }
  if(confirm('Are you sure you want to delete '+checked.length+' message(s)?')){
    checked.forEach(function(c){
      c.closest('tr').remove();
    });
    alert('Deleted!');
  }
}

function deleteAsSpam(){
  var checked=document.querySelectorAll('.msg-check:checked');
  if(checked.length===0){
    alert('No messages selected');
    return;
  }
  if(confirm('Delete '+checked.length+' message(s) as spam?')){
    checked.forEach(function(c){
      c.closest('tr').remove();
    });
    alert('Deleted as spam!');
  }
}

function refreshMessages(){
  location.reload();
}
