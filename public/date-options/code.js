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
  2:'<a href="/posting-options/index.html">Posting options</a><a href="/date-options/index.html">Date options</a><a href="#">Emoticons</a><a href="#">Filtering</a>',
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

// ===== Date Options Specific =====
function chk_dateopt(){
  var msg=document.getElementById('m_dateopt');
  if(msg){
    msg.textContent='✅ Settings saved!';
    msg.className='frmmsg1 Okay';
    setTimeout(function(){msg.textContent='';},3000);
  }
  return false;
}

function pad(n){
  if(n<10)return "0"+n;
  else return n;
}

function getdaysuff(d){
  if(d.getDate()<10)s=d.getDate();
  else s=(new String(d.getDate()).substring(1))*1;
  if(s>3)return "th";
  switch(s){
    case 0:return "th";
    case 1:return "st";
    case 2:return "nd";
    case 3:return "rd";
  }
}

function gettime(d){
  var f=document.forms["dateopt"];
  if(!f)return "";
  var tformat=f.tformat.options[f.tformat.selectedIndex].value;
  if(tformat=="1"){
    return (pad((d.getHours()>12)?d.getHours()-12:d.getHours()))+":"+pad(d.getMinutes())+" "+((d.getHours()>12)?"PM":"AM");
  }
  else return pad(d.getHours())+":"+pad(d.getMinutes());
}

function calcdate(){
  var f=document.forms["dateopt"];
  if(!f)return;
  var tz=parseFloat(f.tzone.value);
  if(tz<-12||tz>13){alert("Time zone is invalid. Must be a number between -12 and 13");return false;}

  var d=(new Date()).getTime()-3600000*((new Date()).getTimezoneOffset()/-60);
  d=new Date(d+3600000*tz);

  var format=parseInt(f.dformat.options[f.dformat.selectedIndex].value);
  var months=new Array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");
  var days=new Array("Sun","Mon","Tue","Wed","Thu","Fri","Sat");
  var dstr="";
  switch(format){
    case 0:dstr=d.getDate()+" "+months[d.getMonth()]+" "+new String(d.getFullYear()).substring(2)+", "+gettime(d);break;
    case 2:dstr=pad(d.getDate())+"/"+pad(d.getMonth()+1)+"/"+d.getFullYear()+", "+gettime(d);break;
    case 4:dstr=pad(d.getMonth()+1)+"/"+pad(d.getDate())+"/"+d.getFullYear()+", "+gettime(d);break;
    case 6:dstr=d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+", "+gettime(d);break;
    case 8:dstr=d.getDate()+getdaysuff(d)+" "+months[d.getMonth()]+" "+d.getFullYear()+", "+gettime(d);break;
    case 10:dstr=days[d.getDay()]+", "+months[d.getMonth()]+" "+d.getDate()+getdaysuff(d)+" "+d.getFullYear()+", "+gettime(d);break;
  }
  document.getElementById("ddemo").innerHTML=dstr;
}

function gettz(){
  var tz=(new Date()).getTimezoneOffset();
  tz=tz/-60;
  document.getElementById("tzone").value=tz.toFixed(2);
  calcdate();
}
