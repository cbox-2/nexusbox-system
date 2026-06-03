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
  4:'<a href="#">Messages</a><a href="#">Archives</a><a href="/sticky-message/index.html">Sticky message</a><a href="/channels/index.html">Channels</a><a href="/webhook/index.html">Webhook</a>'
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

// ===== Sticky Message Specific =====
function chk_fsticky(){
  var sticky=document.querySelector('textarea[name="sticky"]');
  if(!sticky)return false;
  
  var msg=document.getElementById('m_fsticky');
  if(msg){
    msg.textContent='✅ Sticky message saved!';
    msg.className='frmmsg1 Okay';
    setTimeout(function(){msg.textContent='';},3000);
  }
  return false;
}

// Character counter
function updateCharCounter(){
  var textarea=document.querySelector('textarea[name="sticky"]');
  if(!textarea)return;
  
  var counter=document.getElementById('charCounter');
  if(!counter){
    counter=document.createElement('div');
    counter.id='charCounter';
    counter.className='char-counter';
    textarea.parentElement.appendChild(counter);
  }
  
  var length=textarea.value.length;
  var max=50000;
  counter.innerHTML='Characters: <span class="count">'+length+'</span> / '+max;
  
  counter.classList.remove('warning','danger');
  if(length>max*0.9){
    counter.classList.add('danger');
  }else if(length>max*0.7){
    counter.classList.add('warning');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded',function(){
  var textarea=document.querySelector('textarea[name="sticky"]');
  if(textarea){
    textarea.addEventListener('input',function(){
      if(this.value.length>50000){
        this.value=this.value.substring(0,50000);
      }
      updateCharCounter();
    });
    updateCharCounter();
  }
});
