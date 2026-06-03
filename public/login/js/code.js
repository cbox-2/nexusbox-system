document.addEventListener('DOMContentLoaded', function() {
  
  // إخفاء تنبيه الجلسة بعد 4 ثواني
  const alertBox = document.getElementById('sessionAlert');
  if (alertBox) {
    setTimeout(() => {
      alertBox.style.transition = 'opacity 0.5s, height 0.5s';
      alertBox.style.opacity = '0';
      setTimeout(() => alertBox.remove(), 500);
    }, 4000);
  }

  // تفاعل زر "قفل الصندوق"
  const lockBox = document.getElementById('lockBox');
  if (lockBox) {
    lockBox.addEventListener('change', function() {
      const status = this.checked ? '🔒 تم قفل الصندوق (محاكاة محلية)' : '🔓 تم فتح الصندوق';
      alert(status);
    });
  }

  // تفاعل زر "إغلاق الصندوق"
  const closeBtn = document.getElementById('closeBox');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      if (confirm('⚠️ هل أنت متأكد من إغلاق الصندوق؟\nسيتم تعطيل الوصول للوحة التحكم.')) {
        alert('✅ تم الإغلاق (تجريبي محلي)');
        document.getElementById('main').style.opacity = '0.5';
        closeBtn.disabled = true;
        closeBtn.textContent = 'مغلق';
      }
    });
  }

  // منع إرسال النماذج فعلياً (تجريبي)
  const forms = document.querySelectorAll('form');
  forms.forEach(f => {
    f.addEventListener('submit', function(e) {
      e.preventDefault();
      alert('🔐 نموذج تسجيل دخول تجريبي.\nلربط حقيقي يحتاج خادم خلفي (Backend).');
    });
  });

  // زر حفظ التغييرات
  const saveBtn = document.getElementById('saveChanges');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      this.textContent = 'جاري الحفظ...';
      setTimeout(() => {
        this.textContent = 'تم الحفظ ✓';
        this.style.background = '#a6d83f';
        this.style.color = '#fff';
        this.style.borderColor = '#8bc34a';
        setTimeout(() => this.textContent = 'تحميل...', 2000);
      }, 800);
    });
  }

  // روابط المساعدة الوهمية
  document.getElementById('helpLimit')?.addEventListener('click', e => {
    e.preventDefault();
    alert('📖 سيتم تجاوز الحد المسموح به؟\nيرجى ترقية الخطة لزيادة السعة.');
  });

  // تأثير تحويم الحقول
  document.querySelectorAll('.form, .txtbox').forEach(input => {
    input.addEventListener('focus', () => input.style.boxShadow = '0 0 0 2px rgba(5,154,208,0.3)');
    input.addEventListener('blur', () => input.style.boxShadow = 'none');
  });

});