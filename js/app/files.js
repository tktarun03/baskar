/* BasKar · js/app/files.js
   Saving a file for the person: a normal browser download on the website, or the Claude "downloads" capability
   when the app runs inside a Claude artifact. Resolves 'saved', 'delivered', 'declined', 'busy' or 'unavailable'.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function saveFile(name, data, type) {
  if (!IS_TOP && window.claude && typeof window.claude.use === 'function') {
    return Promise.resolve(window.claude.use('downloads')).then(function (dl) {
      if (!dl) return 'unavailable';
      return dl.save({ filename: name, data: data }).then(function (r) { return r && r.status === 'delivered' ? 'delivered' : 'saved'; }, function (e) {
        var code = e && e.code;
        return code === 'declined' ? 'declined' : code === 'rate_limited' ? 'busy' : 'unavailable';
      });
    }).catch(function () { return 'unavailable'; });
  }
  try {
    var url = URL.createObjectURL(new Blob([data], { type: type || 'application/octet-stream' }));
    var a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 4000);
    return Promise.resolve('saved');
  } catch (e) { return Promise.resolve('unavailable'); }
}

function fileSlug() { return String(BR.name || 'budget').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'budget'; }
