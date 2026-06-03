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
  4:'<a href="#">Messages</a><a href="#">Archives</a><a href="#">Sticky message</a><a href="/channels/index.html">Channels</a><a href="/webhook/index.html">Webhook</a>'
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

// ===== Channels Specific =====
function chk_fthreadadd(){
  var name=document.querySelector('input[name="nme"]').value.trim();
  if(!name){
    alert('Please enter a channel name');
    return false;
  }
  if(name.length>25){
    alert('Channel name must be 25 characters or less');
    return false;
  }
  
  var msg=document.getElementById('m_fthreadadd');
  if(msg){
    msg.textContent='✅ Channel "'+name+'" created!';
    msg.className='frmmsg1 Okay';
    setTimeout(function(){msg.textContent='';},3000);
  }
  
  // Add channel to list
  var tbody=document.getElementById('channelsBody');
  if(tbody){
    var tr=document.createElement('tr');
    tr.innerHTML=`
      <td><input type="checkbox" class="channel-check"></td>
      <td><strong>${name}</strong></td>
      <td style="color:#888">Just now</td>
      <td><a href="#" class="channel-link">Direct link</a></td>
    `;
    tbody.appendChild(tr);
  }
  
  document.querySelector('input[name="nme"]').value='';
  return false;
}

function toggleSearch(){
  var s=document.getElementById('searchBox');
  if(s)s.style.display=s.style.display==='none'?'block':'none';
}

function selectAll(){
  document.querySelectorAll('.channel-check').forEach(function(c){c.checked=!c.checked;});
}

function deleteSelected(){
  var checked=document.querySelectorAll('.channel-check:checked');
  if(checked.length===0){
    alert('No channels selected');
    return;
  }
  if(confirm('Are you sure you want to delete '+checked.length+' channel(s)?')){
    checked.forEach(function(c){
      c.closest('tr').remove();
    });
    alert('Deleted!');
  }
}

function toggleDirectLink(){
  var checked=document.querySelectorAll('.channel-check:checked');
  if(checked.length===0){
    alert('No channels selected');
    return;
  }
  checked.forEach(function(c){
    var link=c.closest('tr').querySelector('.channel-link');
    if(link){
      if(link.textContent==='Direct link'){
        link.textContent='Hide link';
        link.style.color='#fc735a';
      }else{
        link.textContent='Direct link';
        link.style.color='#059ad0';
      }
    }
  });
}

function refreshChannels(){
  location.reload();
}

function copyApiUrl(){
  var apiUrl=document.querySelector('.code').textContent;
  if(navigator.clipboard){
    navigator.clipboard.writeText(apiUrl).then(function(){
      alert('✅ API URL copied to clipboard!');
    });
  }else{
    alert('API URL: '+apiUrl);
  }
}
