// ===== NexusBox Toolbar - Clean Version =====
(function() {
  'use strict';
  
  // Upgrade checkboxes (if needed)
  function upgradeCheckboxes() {
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(function(cb) {
      if (!cb.dataset.upgraded) {
        cb.dataset.upgraded = 'true';
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', upgradeCheckboxes);
  } else {
    upgradeCheckboxes();
  }
})();
