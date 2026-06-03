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

// ===== Filtering Specific =====
function chk_ffilter(){
  var msg=document.getElementById('m_ffilter');
  if(msg){
    msg.textContent='✅ Settings saved!';
    msg.className='frmmsg1 Okay';
    setTimeout(function(){msg.textContent='';},3000);
  }
  return false;
}

// Auto-resize textarea
function rsztxtbox(d){
  var padding=100;
  if(d.scrollHeight<d.offsetHeight)return;
  d.style.height=d.scrollHeight+padding+"px";
}

// Count lines in textarea
function numlines(wordbox){
  return wordbox.value?(wordbox.value.split(/\r\n|\r|\n/).length-(wordbox.value[wordbox.value.length-1]=="\n"?1:0)):0;
}

function updateCount(){
  var wordbox=document.forms["ffilter"]["wordsub"];
  if(!wordbox)return;
  var count=numlines(wordbox);
  var ftcount=document.getElementById("ftcount");
  var ftlimit=document.getElementById("ftlimit");
  if(ftcount)ftcount.innerHTML=count;
  if(ftlimit)ftlimit.innerHTML=100;
  
  if(count>100){
    var notice=document.getElementById("limitNotice");
    if(notice)notice.style.display="block";
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded',function(){
  var wordbox=document.forms["ffilter"]["wordsub"];
  if(wordbox){
    rsztxtbox(wordbox);
    wordbox.onkeyup=function(e){
      if(this.value.length>30000){
        this.value=this.value.substring(0,30000);
      }
      rsztxtbox(wordbox);
      updateCount();
    };
    updateCount();
  }
});
