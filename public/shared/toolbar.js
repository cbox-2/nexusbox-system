// ===== إصلاح الـ Layout بعد الترجمة =====

// دالة لإصلاح جميع الأزرار
function fixToolbarLayout() {
  console.log('🔧 إصلاح الـ Layout...');
  
  // إصلاح الـ Header
  const header = document.getElementById('header');
  if (header) {
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.flexWrap = 'nowrap';
  }
  
  // إصلاح أزرار Header
  const headerExtras = document.getElementById('headerExtras');
  if (headerExtras) {
    headerExtras.style.display = 'flex';
    headerExtras.style.gap = '5px';
    headerExtras.style.flexWrap = 'nowrap';
    headerExtras.style.alignItems = 'center';
  }
  
  // إصلاح الـ Subbar
  const subbar = document.getElementById('subbar');
  if (subbar) {
    subbar.style.display = 'block';
    subbar.style.height = 'auto';
    subbar.style.minHeight = '50px';
  }
  
  // إصلاح الـ Wrap
  const wrap = document.querySelector('#subbar .wrap');
  if (wrap) {
    wrap.style.display = 'flex';
    wrap.style.flexWrap = 'wrap';
    wrap.style.justifyContent = 'center';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '5px';
    wrap.style.minHeight = '40px';
  }
  
  // إصلاح جميع الأزرار
  const items = document.querySelectorAll('.submenuitem');
  items.forEach((item, i) => {
    item.style.cssText = `
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: relative !important;
      background: rgba(255,255,255,0.15) !important;
      color: white !important;
      border-radius: 8px !important;
      padding: 5px 10px !important;
      margin: 2px !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      white-space: nowrap !important;
      border: 1px solid rgba(255,255,255,0.25) !important;
      flex-shrink: 0 !important;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    `;
  });
  
  console.log(`✅ تم إصلاح ${items.length} زر`);
}

// مراقبة التغييرات في الصفحة (MutationObserver)
const observer = new MutationObserver(function(mutations) {
  let needFix = false;
  
  mutations.forEach(function(mutation) {
    // إذا تغيرت النصوص (الترجمة)
    if (mutation.type === 'childList' || mutation.type === 'characterData') {
      needFix = true;
    }
    // إذا تغيرت الـ attributes
    if (mutation.type === 'attributes') {
      needFix = true;
    }
  });
  
  if (needFix) {
    // انتظر قليلاً ثم أصلح
    setTimeout(fixToolbarLayout, 100);
  }
});

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎨 بدء التطبيق...');
  
  // إصلاح فوري
  fixToolbarLayout();
  
  // مراقبة الـ Header و Subbar
  const header = document.getElementById('header');
  const subbar = document.getElementById('subbar');
  
  if (header) {
    observer.observe(header, {
      childList: true,
      characterData: true,
      attributes: true,
      subtree: true
    });
  }
  
  if (subbar) {
    observer.observe(subbar, {
      childList: true,
      characterData: true,
      attributes: true,
      subtree: true
    });
  }
  
  // إصلاح دوري كل 2 ثانية (للتأكد)
  setInterval(fixToolbarLayout, 2000);
  
  console.log('✅ المراقبة مفعلة - الأزرار راح تصلح تلقائياً بعد الترجمة');
});

// إصلاح عند تغيير حجم النافذة
window.addEventListener('resize', fixToolbarLayout);
