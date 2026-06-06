menuon = false;
curmnu = null;

mnupgs = new Array("snippet", "style", "settings", "users", "messages");

mnucont = new Array();
mnucont[0] = new Array("snippet", "123", "XHTML Code", "account", "account", "Quick Link");
mnucont[1] = new Array(
	"layout", 	"-154px -0px", 	"Layout options", 
	"style", 	"-0px -0px", 	"Theme editor"
	//"styleadv", 	"-110px -0px", 	"Edit CSS"
	);
mnucont[2] = new Array(
	"settings", 	"-0px -154px", 	"Posting options", 
	"dateopt", 	"-176px -0px", 	"Date options", 
	"smilies", 	"-0px -132px", 	"Emoticons", 
	"filtering", 	"-220px -0px", 	"Filtering"
	);
mnucont[3] = new Array(
	"users", 	"-44px -0px", 	"Registered users", 
	"bans", 	"-88px -0px", 	"Blocked users", 
	"userint", 	"-0px -88px", 	"User integration"
	);
mnucont[4] = new Array(
	"posts", 	"-198px -0px", 	"Messages", 
	"postsarc", 	"-0px -44px", 	"Archives", 
	"sticky", 	"-0px -22px", "Sticky message",
	"channels", 	"-22px -22px", "Channels",
	"webhook", 	"-0px -178px", "Webhook"
	);


function hovmenu (o, mnu, ishov) {

	var hm = document.getElementById("hovmenu");
	var bar = document.getElementById("subbar");

  if (ishov && !menuon) return false;	// don't do anything if menu is invisible and we're hovering
  
  var str = '';
  for (var i = 0; i < mnucont[mnu].length / 3; i++) {
    str += '<a href="/admin?'+mnucont[mnu][i+i*2]+'"><span class="submenuimg" style="background-position: '+mnucont[mnu][i*3+1]+'"></span> '+mnucont[mnu][i*3+2]+'</a>';
  }
  hm.innerHTML = str;
  
  curmnu = o;

  if (!menuon) togglemenu();

  return false;		// prevents menu links being followed in browsers which support this
}

function togglemenu () {
	var $mask = document.getElementById("mask");
	var hm = document.getElementById("hovmenu");
	
  if (!menuon) {
    hm.style.display = "block";
	//$mask.style.display = "block";
	//$mask.onmousedown = togglemenu;
    menuon = 1;
  }
  else {
    //hm.style.display = "none";
	//$mask.style.display = "none";
    menuon = 0;
  }
}

// Stuff for control panel (but some also needed for pop overlay (which itself may only be used on CP?))
var formwait = null;
var subsavetmr = new Array();

function rcvdformresponse(i) {
  var r = i.substring(2); // root name
  if (subsavetmr[r]) window.clearTimeout(subsavetmr[r]);
  var loc = frames[i].location.href;
  if (loc == "javascript:false" || loc == "about:blank") return false; // first load.
  else if (frames[i].location.href == "javascript:true") setmsg(r, "Timeout. Please try again.", 2);
  else {
    if (frames[i].ld != 1) setmsg(r, "Error. Please try again.", 2);
    if (!frames[i].substaydisabled) {
		document.forms[r][subinfo[r][0]].disabled = false;  // enable again the registered (via subsaving()) submit button, if frame failed to load.
	}
  }

}

function setmsg(n, m, a) {
  x = document.getElementById("m_"+n);
  x.innerHTML = m;
  switch (a) {
    default: x.className = "frmmsg1"; break;
    case 1: x.className = "frmmsg1 Okay"; break;
    case 2: x.className = "frmmsg1 Error"; break;
  }
}

function setmsgdesc(f, e, a) {
  var m = document.getElementById("em_"+f);
  switch (a) {
    default: m.className = "frmmsg2"; break;
    case 1: m.className = "frmmsg2 Okay"; break;
    case 2: m.className = "frmmsg2 Error"; break;
  }
  m.innerHTML = "<ul>"+e+"</ul>";
  m.style.height = "auto";
  h = m.clientHeight;
  msgdescrsz (m, 0, h);  
}

function resetmsgs(f) {
  var m = document.getElementById("m_"+f);
  m.innerHTML = "";
  var e = document.getElementById("em_"+f);
  e.innerHTML = "";
  e.style.height = 0;
  /*
  var spn = document.getElementsByTagName("span");
  for (var i = 0; i < spn.length; i++) { 
    if (spn[i].id && spn[i].id.substring(0, 3+f.length) == "ei_"+f) spn[i].innerHTML = "";
  }
  */
}


var msgdescrsztmr = null;

// Would be simpler as a loop if we had a way to set a sleep interval.
function msgdescrsz (x, sh, eh) {
  window.clearTimeout(msgdescrsztmr);
  if (sh >= eh) return false;
  x.style.height = Math.ceil(sh)+"px";
  eh *= 1000;
  sh *= 1000;
  d = eh - sh;
  d = Math.floor(d / 5) + 1000;
  nh = sh+d;
  if (nh > eh || d <= 0) nh = eh;
  msgdescrsztmr = window.setTimeout(abc = function() {msgdescrsz(x, nh/1000, eh/1000)}, 50);
}


var subinfo = new Array();	// the info passed to subsaving to submit the form. So we can resubmit / reset buttons etc.

// i = form name, j = submit button name, t = message.
function subsaving(i, j, t) {
  k = document.forms[i];
  subinfo[i] = new Array();
  subinfo[i][0] = j;
  subinfo[i][1] = t;
  if (k[j].disabled) return false;
  k[j].disabled = true;
  resetmsgs(i);	// not all forms do a chk_ first, and those that don't need their stuff reset.
  setmsg(i, (t)?t:"saving...", 0);
  subsavetmr[i] = window.setTimeout("subsavingfail(\""+i+"\")", 1000 * 10);
  
  return true;
}

// simulates premature "loaded" state so we can end the torture.
function subsavingfail(i) {
  frames["t_"+i].location.href = "javascript:true;";
}

function popwin(id, page, w, h) {
  x = window.open(page, id, 'width='+w+',height='+h+',toolbar=no,status=no,resizable=yes,scrollbars=yes');
  x.isPopup = true;
  x.focus();
}






// -------- Have-Session stuff --------


  // Modal dialogs. 
  // Scattered implementation: log-in markup is static in header, log-out is below, and delete prompt is in admin.
  po_box = document.getElementById("popovr_box");
  po_text = document.getElementById("popovr_text");
  po_title = document.getElementById("popovr_title");
  

  function popovr(t, x) {
    po_box.style.display = "block";
    po_text.innerHTML = x;
    po_title.innerHTML = t;
  }
  
  function popovr_close() {
    po_box.style.display = "none";
    document.getElementById("popovr_t_login").style.display = "none";	// rough hack
  }
  
  function logout() {
    popovr('Log out', '<p>Log out of the control panel?</p><fieldset><div style="float: right;"><input type="button" value=" Yes " onclick="location.href=\'admin?preproc=logout\'"> <input type="button" value=" No " onclick="popovr_close()"></div></fieldset>');
    return false;
  }
  
  
var upgradeCheckboxes = function () {
	if (!Array.prototype.indexOf || !Array.prototype.indexOf.call) {
		return;
	}
	var cbs = document.getElementsByTagName("input");
	for (var i = 0; i < cbs.length; i++) {
		if (cbs[i].type !== "checkbox") {
			continue;
		}
		if (cbs[i].className === "NoReplace") {
			continue;
		}
		var parent = cbs[i].parentElement;
		var pos = Array.prototype.indexOf.call(parent.children, cbs[i]);
		var $cdiv = document.createElement("div");
		$cdiv.className = "slideThree";
		var $lbl = document.createElement("label");
		$cdiv.appendChild(cbs[i]);
		$cdiv.appendChild($lbl);
		parent.insertBefore($cdiv, parent.children[pos]);
	}
};


if (document.forms['qlogin'] && location.protocol == "http:") {
	var fq = document.forms['qlogin'];
	fq['pword'].parentElement.removeChild(fq['pword']);
}


/* Based on code from /imgs/ */
var noteTmr = null;
var showSiteError = function (type, text) {
	if (noteTmr !== null) {
		window.clearTimeout(noteTmr);
		noteTmr = null;
	}
	
	var $nb = document.getElementById("siteErrorBar");
	var $nbCont = document.getElementById("siteErrorBarCont");
	
	if (!type && !text) {
		$nb.className = "Hidden";
		return;
	}
	
	var cN = type == 'error' ? 'Error' : '';
	
	$nbCont.innerHTML = text + '&nbsp;' + (type == 'error' ? '' : '');
	
	$nb.className = "Visible " + cN;
	
	noteTmr = window.setTimeout(function () {
		$nb.className = "Hidden";
	}, 5000);
};




/* Dynamic active link setter
var path = location.pathname.substring(1);
for (var i in document.links) {
	var href = document.links[i].href;
	if (href && href.substring(href.lastIndexOf("/")+1) === path) {
		document.links[i].className += " Active";
	}
}
*/






