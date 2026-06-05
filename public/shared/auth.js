// التحقق من تسجيل الدخول
(function() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // إذا لم يكن مسجل دخول، حوله لصفحة Login
  if (!token) {
    window.location.href = '/login/index.html';
    return;
  }
  
  // التحقق من صلاحية التوكن
  fetch('/api/auth/me', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login/index.html';
    } else {
      // تحديث معلومات المستخدم
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // إظهار اسم المستخدم في الـ Header
      const userWelcome = document.getElementById('userWelcome');
      if (userWelcome && data.user.username) {
        userWelcome.textContent = data.user.username;
      }
      
      // إخفاء/إظهار الأزرار حسب الصلاحيات
      if (data.user.role !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
      }
      
      if (!['admin', 'moderator'].includes(data.user.role)) {
        document.querySelectorAll('.moderator-only').forEach(el => el.style.display = 'none');
      }
    }
  })
  .catch(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login/index.html';
  });
})();

// دالة تسجيل الخروج
function globalLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login/index.html';
}
