/* Music 页的大播放器
 * 整页加载时由 MetingJS 自己扫 .aplayer 初始化；
 * 走 pjax 进来时没有 DOMContentLoaded，MetingJS 不会再扫，
 * 所以这里单独把这个容器初始化掉（不会碰左下角那个全局播放器）。
 */
(function () {
  'use strict';

  function init() {
    var el = document.getElementById('music-aplayer');
    if (!el) return;
    if (!window.__pjaxActive) return;              // 整页加载交给 MetingJS
    if (el.getAttribute('data-lp-ready')) return;  // 已经初始化过
    if (el.querySelector('.aplayer-body')) return; // MetingJS 抢先建好了
    if (typeof APlayer === 'undefined') return;

    el.setAttribute('data-lp-ready', '1');

    var api = el.getAttribute('data-api') ||
      'https://api.injahow.cn/meting/?server=:server&type=:type&id=:id&r=:r';
    var url = api
      .replace(':server', el.getAttribute('data-server') || 'netease')
      .replace(':type', el.getAttribute('data-type') || 'playlist')
      .replace(':id', el.getAttribute('data-id') || '')
      .replace(':auth', el.getAttribute('data-auth') || '')
      .replace(':r', String(Math.random()));

    fetch(url, { credentials: 'omit' }).then(function (r) {
      return r.json();
    }).then(function (audioList) {
      if (!audioList || !audioList.length) return;
      if (el.querySelector('.aplayer-body')) return;
      /* eslint-disable no-new */
      new APlayer({
        container: el,
        audio: audioList,
        theme: el.getAttribute('data-theme') || '#ad7a86',
        order: el.getAttribute('data-order') || 'list',
        preload: el.getAttribute('data-preload') || 'none',
        listFolded: el.getAttribute('data-listfolded') !== 'false',
        lrcType: audioList[0].lrc ? 3 : 0,
        mutex: true,
        storageName: 'last-music'
      });
    }).catch(function (err) {
      el.removeAttribute('data-lp-ready');
      if (window.console) console.warn('[music] 歌单加载失败', err);
    });
  }

  if (window.LP) window.LP.add(init);
})();
