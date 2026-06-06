menuon = false;
curmnu = null;

mnupgs = new Array("snippet", "style", "settings", "users", "messages");

mnucont = new Array();
mnucont[0] = new Array("publish", "123", "Publish", "account", "account", "My Account");
mnucont[1] = new Array(
    "lookfeel-layout", "-154px -0px", "Layout options",
    "lookfeel", "-0px -0px", "Theme editor"
);
mnucont[2] = new Array(
    "options", "-0px -154px", "Posting options",
    "options-date", "-176px -0px", "Date options",
    "options-emoji", "-0px -132px", "Emoticons",
    "options-filter", "-220px -0px", "Filtering"
);
mnucont[3] = new Array(
    "users", "-44px -0px", "Registered users",
    "users-banned", "-88px -0px", "Blocked users",
    "users-integration", "-0px -88px", "User integration"
);
mnucont[4] = new Array(
    "messages", "-198px -0px", "Messages",
    "messages-archive", "-0px -44px", "Archives",
    "messages-sticky", "-0px -22px", "Sticky message",
    "messages-channels", "-22px -22px", "Channels",
    "webhook", "-0px -178px", "Webhook"
);

function hovmenu(o, mnu, ishov) {
    var hm = document.getElementById("hovmenu");
    if (ishov && !menuon) return false;
    
    var str = '';
    for (var i = 0; i < mnucont[mnu].length / 3; i++) {
        var page = mnucont[mnu][i*3];
        var icon = mnucont[mnu][i*3+1];
        var label = mnucont[mnu][i*3+2];
        str += '<a href="/admin/' + page + '.html"><span class="submenuimg" style="background-position: ' + icon + '"></span> ' + label + '</a>';
    }
    
    hm.innerHTML = str;
    curmnu = o;
    if (!menuon) togglemenu();
    return false;
}

function togglemenu() {
    var hm = document.getElementById("hovmenu");
    if (!menuon) {
        hm.style.display = "block";
        menuon = 1;
    } else {
        hm.style.display = "none";
        menuon = 0;
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}
