const SHARED = {
  API: window.location.origin,
  renderTopbar: function() {
    return '<div class="topbar"><div class="topbar-right"><a href="/admin/account.html">حسابي</a><a href="/admin/index.html">صناديق بريدي</a><a href="/admin/support.html">الدعم</a><a href="#" onclick="SHARED.logout();return false;">تسجيل الخروج</a><span class="user-email" id="userEmail">جاري التحميل...</span></div><div class="logo-area"><a href="/">NexusBox</a></div></div>';
  },
  renderNavbar: function(activePage) {
    const pages = [
      {id:'messages',label:'رسائل',url:'/admin/messages.html'},
      {id:'users',label:'المستخدمون',url:'/admin/users.html'},
      {id:'options',label:'خيارات',url:'/admin/options.html'},
      {id:'lookfeel',label:'المظهر والملمس',url:'/admin/lookfeel.html'},
      {id:'publish',label:'نشر',url:'/admin/publish.html'}
    ];
    let h = '<div class="navbar"><div class="navbar-right">';
    pages.forEach(p => { h += '<a href="'+p.url+'" class="'+(p.id===activePage?'active':'')+'">'+p.label+'</a>'; });
    h += '</div></div>';
    return h;
  },
  renderFooter: function() {
    return '<div class="footer"><p>&copy; 2026 NexusBox - جميع الحقوق محفوظة</p></div>';
  },
  init: function(activePage) {
    document.body.insertAdjacentHTML('afterbegin', this.renderTopbar() + this.renderNavbar(activePage));
    document.body.insertAdjacentHTML('beforeend', this.renderFooter());
    this.loadUserInfo();
  },
  loadUserInfo: async function() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(this.API + '/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await res.json();
      if (data.success && data.user) {
        const el = document.getElementById('userEmail');
        if (el) el.textContent = data.user.email || data.user.username;
      }
    } catch(e) {}
  },
  logout: function() {
    localStorage.removeItem('token');
    window.location.href = '/';
  },
  getAuthHeaders: function() {
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') };
  },
  showSuccess: function(msg) {
    const el = document.getElementById('successMsg');
    if (el) { el.textContent = msg; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 3000); }
  },
  showError: function(msg) {
    const el = document.getElementById('errorMsg');
    if (el) { el.textContent = msg; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 5000); }
  }
};
