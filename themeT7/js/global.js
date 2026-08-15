/**
 * Valentine Sites - Global JS
 * Shared utilities; keep client logic in js/clients/<name>.js
 */

(function () {
  'use strict';
  // Add any global helpers here, e.g. getClientNameFromPath()
  window.ValentineGlobal = {
    getClientFromPath: function () {
      var path = (window.location.pathname || '/').replace(/^\//, '').replace(/\/$/, '');
      var parts = path.split('/');
      return parts[0] || null; // first segment is client name
    }
  };
})();
