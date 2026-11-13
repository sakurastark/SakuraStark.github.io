/* 图库交互：灯箱 / 索引页翻页 / 相册内页翻页 */
(function () {
  'use strict';

  /* ---------- 1. 灯箱 ---------- */
  var dlg, imgEl, list = [], idx = 0;

  function buildLightbox() {
    dlg = document.createElement('dialog');
    dlg.id = 'gallery-lightbox';
    imgEl = document.createElement('img');
    dlg.appendChild(imgEl);
    document.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    document.addEventListener('keydown', function (e) {
      if (!dlg || !dlg.open) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
      else if (e.key === 'Escape') dlg.close();
    });
  }

  function show(i) {
    if (!list.length) return;
    idx = (i + list.length) % list.length;
    imgEl.src = list[idx].getAttribute('href');
    var inner = list[idx].querySelector('img');
    imgEl.alt = inner ? inner.alt : '';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('.gallery-item') : null;
    if (!a) return;
    e.preventDefault();
    if (!dlg) buildLightbox();
    var scope = a.closest('.album-book') || a.closest('.gallery-grid') || document;
    list = Array.prototype.slice.call(scope.querySelectorAll('.gallery-item'));
    show(list.indexOf(a));
    dlg.showModal();
  });

  /* ---------- 2. 索引页：点击相册卡槽，整页翻转后跳转 ---------- */
  var overlay;
  document.addEventListener('click', function (e) {
    var slot = e.target.closest ? e.target.closest('.book .album-slot') : null;
    if (!slot) return;
    var href = slot.getAttribute('href');
    if (!href) return;
    e.preventDefault();
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'page-flip';
      document.body.appendChild(overlay);
    }
    overlay.classList.remove('out');
    void overlay.offsetWidth;
    requestAnimationFrame(function () { overlay.classList.add('out'); });
    setTimeout(function () { window.location.href = href; }, 720);
  });

  /* ---------- 3. 相册内页：左右翻页 ---------- */
  function setupBook(book) {
    var spreads = book.querySelectorAll('.album-book-spread');
    var counter = book.querySelector('.album-book-counter .cur');
    var prev = book.querySelector('.album-book-nav.prev');
    var next = book.querySelector('.album-book-nav.next');
    var cur = 0;

    function render() {
      for (var i = 0; i < spreads.length; i++) {
        spreads[i].classList.toggle('is-active', i === cur);
      }
      if (counter) counter.textContent = String(cur + 1);
      if (prev) prev.disabled = cur === 0;
      if (next) next.disabled = cur === spreads.length - 1;
    }

    if (prev) prev.addEventListener('click', function () { if (cur > 0) { cur--; render(); } });
    if (next) next.addEventListener('click', function () { if (cur < spreads.length - 1) { cur++; render(); } });

    document.addEventListener('keydown', function (e) {
      if (dlg && dlg.open) return;
      if (e.key === 'ArrowLeft' && cur > 0) { cur--; render(); }
      if (e.key === 'ArrowRight' && cur < spreads.length - 1) { cur++; render(); }
    });

    render();
  }

  function init() {
    var books = document.querySelectorAll('.album-book');
    for (var i = 0; i < books.length; i++) setupBook(books[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();