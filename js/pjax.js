/* 轻量 pjax
 * 只替换 #content-outer 里的内容，头部、页脚、全局播放器都不重建，
 * 所以音乐在换页时不会中断。
 * 没有额外依赖；失败（404/网络错误）时自动退回整页跳转。
 */
(function () {
  'use strict';

  var cfg = window.PJAX_CONFIG || {};
  var MOUNT = cfg.mount || '#content-outer';
  var bar = null;

  /* ---------- 顶部进度条 ---------- */
  function startBar() {
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'pjax-progress';
      document.body.appendChild(bar);
    }
    bar.classList.remove('done');
    // 强制回流，保证从 0 重新开始
    void bar.offsetWidth;
    bar.classList.add('on');
    document.body.classList.add('pjax-loading');
  }

  function endBar() {
    if (!bar) return;
    bar.classList.add('done');
    document.body.classList.remove('pjax-loading');
    setTimeout(function () {
      if (!bar) return;
      bar.classList.remove('on', 'done');
    }, 320);
  }

  /* ---------- 样式表 / 脚本同步 ---------- */
  function syncAssets(doc) {
    var i, key;
    var nextLinks = doc.querySelectorAll('link[rel="stylesheet"][href]');
    var next = {};
    for (i = 0; i < nextLinks.length; i++) next[nextLinks[i].getAttribute('href')] = nextLinks[i];

    var curLinks = document.querySelectorAll('link[rel="stylesheet"][href]');
    for (i = 0; i < curLinks.length; i++) {
      key = curLinks[i].getAttribute('href');
      if (!next[key]) curLinks[i].parentNode.removeChild(curLinks[i]);
    }

    var have = {};
    var nowLinks = document.querySelectorAll('link[rel="stylesheet"][href]');
    for (i = 0; i < nowLinks.length; i++) have[nowLinks[i].getAttribute('href')] = 1;
    for (key in next) {
      if (!have[key]) document.head.appendChild(next[key].cloneNode(true));
    }

    // 脚本：只补当前页面还没有的（已经加载过的绝不再跑一次）
    var haveSrc = {};
    var curScripts = document.querySelectorAll('script[src]');
    for (i = 0; i < curScripts.length; i++) haveSrc[curScripts[i].getAttribute('src')] = 1;

    var nextScripts = doc.querySelectorAll('script[src]');
    for (i = 0; i < nextScripts.length; i++) {
      key = nextScripts[i].getAttribute('src');
      if (!key || haveSrc[key]) continue;
      haveSrc[key] = 1;
      var s = document.createElement('script');
      s.src = key;
      s.async = false;
      document.body.appendChild(s);
    }
  }

  /* ---------- 换内容 ---------- */
  function swap(html, opts) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var fresh = doc.querySelector(MOUNT);
    var cur = document.querySelector(MOUNT);
    if (!fresh || !cur) throw new Error('找不到挂载点 ' + MOUNT);

    cur.innerHTML = fresh.innerHTML;
    if (doc.title) document.title = doc.title;

    // home / post / gallery-page 决定深色还是浅色，必须跟着换
    document.body.className = doc.body.className;
    window.isHome = /(^|\s)home(\s|$)/.test(doc.body.className);

    syncAssets(doc);

    window.__pjaxActive = true;

    if (opts && typeof opts.y === 'number' && opts.y > 0) {
      window.scrollTo(0, opts.y);
    } else {
      window.scrollTo(0, 0);
    }

    if (window.LP) window.LP.run();

    // 搜索框在头部（不会被替换），换页后清掉上一次的结果，免得下拉残留
    var sr = document.getElementById('local-search-result');
    if (sr) sr.innerHTML = '';
  }

  /* ---------- 导航 ---------- */
  var controller = null;

  function navigate(url, opts) {
    opts = opts || {};
    startBar();

    if (!opts.pop) {
      try {
        history.pushState({ y: window.scrollY }, '', url);
      } catch (e) { /* 跨域等情况忽略 */ }
    }

    if (controller) {
      try { controller.abort(); } catch (e) {}
    }
    controller = window.AbortController ? new AbortController() : null;

    fetch(url, {
      credentials: 'same-origin',
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }).then(function (html) {
      controller = null;
      swap(html, opts);
      endBar();
    }).catch(function (err) {
      controller = null;
      if (err && err.name === 'AbortError') return;
      // 兜底：退回整页跳转，别让链接点了没反应
      endBar();
      window.location.href = url;
    });
  }

  /* ---------- 哪些链接走 pjax ---------- */
  function interceptable(a) {
    if (a.hasAttribute('download')) return null;
    if (a.getAttribute('data-pjax') === 'false') return null;
    var target = a.getAttribute('target');
    if (target && target !== '_self') return null;

    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return null;
    if (/^(mailto:|tel:|javascript:|data:|blob:)/i.test(href)) return null;

    var u;
    try { u = new URL(a.href, location.href); } catch (e) { return null; }
    if (u.origin !== location.origin) return null;
    if (u.pathname === location.pathname && u.search === location.search) return null;
    if (/\.(png|jpe?g|gif|svg|webp|avif|pdf|zip|xml|json|txt|ico|mp3|mp4)$/i.test(u.pathname)) return null;
    return u.href;
  }

  function onClick(e) {
    if (e.defaultPrevented) return;            // 灯箱、书页翻转等已经处理过了
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var url = interceptable(a);
    if (!url) return;
    e.preventDefault();
    navigate(url, {});
  }

  if (cfg.on !== false && window.fetch && window.history && window.DOMParser) {
    document.addEventListener('click', onClick, false);
    window.addEventListener('popstate', function (e) {
      var y = e.state && typeof e.state.y === 'number' ? e.state.y : 0;
      navigate(location.href, { pop: true, y: y });
    });
    // 暴露给需要「先做动画再跳转」的地方（图库书页翻转）
    window.PJAX = { go: function (url) { navigate(url, {}); } };
  } else {
    window.PJAX = null;
  }

  /* ---------- 首次进入 ---------- */
  function boot() {
    if (window.LP) window.LP.run();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
