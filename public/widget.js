// NexusBox Widget - Embed System
(function() {
  'use strict';
  
  // الحصول على box ID من data attribute
  const scriptTag = document.currentScript;
  const boxKey = scriptTag.getAttribute('data-box');
  
  if (!boxKey) {
    console.error('NexusBox Widget: data-box attribute is required');
    return;
  }
  
  // إنشاء iframe
  const iframe = document.createElement('iframe');
  iframe.src = window.location.origin + '/embed.html?key=' + boxKey;
  iframe.style.border = 'none';
  iframe.style.width = '100%';
  iframe.style.maxWidth = '500px';
  iframe.style.height = '600px';
  iframe.style.borderRadius = '15px';
  iframe.style.boxShadow = '0 10px 40px rgba(0,0,0,0.2)';
  iframe.setAttribute('allowfullscreen', 'true');
  iframe.setAttribute('loading', 'lazy');
  
  // إضافة iframe للصفحة
  scriptTag.parentNode.insertBefore(iframe, scriptTag);
  
  console.log('NexusBox Widget loaded for box:', boxKey);
})();
