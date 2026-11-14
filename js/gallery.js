/* 图库交互：灯箱 / 索引页翻页 / 相册内页翻页
 * 委托到 document 的监听只绑一次；每页的翻页逻辑在 init() 里重建。
 */
(function () {
  'use strict';

  var dlg, imgEl, list = [], idx = 0;

  /* ---------- 1. 灯箱 ---------- */
  function buildLightbox() {
    dlg = document.createElement('dialog');
    dlg.id = 'gallery-lightbox';
    imgEl = document.createElement('img');
    dlg.appendChild(imgEl);
    document.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  function show(i) {
    if (!list.length) return;
    idx = (i + list.length) % list.length;
    imgEl.src = list[idx].getAttribute('href');
    var inner = list[idx].querySelector('img');
    imgEl.alt = inner ? inner.alt : '';
  }

  /* ---------- 2. 索引页：整页翻转后进入相册 ---------- */
  var overlay;

  function flipTo(href) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'page-flip';
      document.body.appendChild(overlay);
    }
    var ov = overlay;
    ov.classList.remove('out');
    void ov.offsetWidth;
    requestAnimationFrame(function () { ov.classList.add('out'); });

    setTimeout(function () {
      if (window.PJAX) window.PJAX.go(href);
      else window.location.href = href;
    }, 720);

    // 动画放完必须把遮罩从 DOM 里删掉。
    // 原来这里只是去掉 .out，遮罩会回到不透明状态（z-index 9999、整屏），
    // 而它挂在 body 上、pjax 换页不会替换它 —— 于是新页面被一张米色毯子盖住，
    // 看起来就是「进了相册要刷新一下才显示」。
    setTimeout(function () {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      if (overlay === ov) overlay = null;
    }, 1500);
  }

  /* ---------- 3. 相册内页：左右翻页 ---------- */
  window.__book = null;

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

    render();

    return {
      step: function (d) {
        var n = cur + d;
        if (n < 0 || n >= spreads.length) return;
        cur = n;
        render();
      }
    };
  }

  function init() {
    window.__book = null;
    var books = document.querySelectorAll('.album-book');
    for (var i = 0; i < books.length; i++) {
      window.__book = setupBook(books[i]);
    }
  }

  /* ---------- 委托监听：只绑一次 ---------- */
  if (!window.__galleryBound) {
    window.__galleryBound = true;

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;

      var item = t.closest('.gallery-item');
      if (item) {
        e.preventDefault();
        if (!dlg) buildLightbox();
        var scope = item.closest('.album-book') || item.closest('.gallery-grid') || document;
        list = Array.prototype.slice.call(scope.querySelectorAll('.gallery-item'));
        show(list.indexOf(item));
        dlg.showModal();
        return;
      }

      var slot = t.closest('.book .album-slot');
      if (slot && slot.getAttribute('href')) {
        e.preventDefault();
        flipTo(slot.getAttribute('href'));
      }
    }, false);

    document.addEventListener('keydown', function (e) {
      if (dlg && dlg.open) {
        if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
        else if (e.key === 'Escape') dlg.close();
        return;
      }
      if (!window.__book) return;
      if (e.key === 'ArrowLeft') window.__book.step(-1);
      if (e.key === 'ArrowRight') window.__book.step(1);
    });
  }

  if (window.LP) window.LP.add(init);
})();
