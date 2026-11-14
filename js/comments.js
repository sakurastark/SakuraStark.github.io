/* Disqus 评论区
 * 首次进入时插入 embed.js；pjax 换页后用 DISQUS.reset 切到新的 thread，
 * 这样不会整页重载，也没有「评论区长在旧文章上」的问题。
 */
(function () {
  'use strict';

  function init() {
    var el = document.getElementById('disqus_thread');
    if (!el) return;

    var shortname = el.getAttribute('data-shortname');
    if (!shortname) return;

    var pageUrl = el.getAttribute('data-page-url') || location.href;
    var pageId = el.getAttribute('data-page-identifier') || pageUrl;
    var pageTitle = el.getAttribute('data-page-title') || document.title;

    if (window.DISQUS && typeof window.DISQUS.reset === 'function') {
      window.DISQUS.reset({
        reload: true,
        config: function () {
          this.page.identifier = pageId;
          this.page.url = pageUrl;
          this.page.title = pageTitle;
        }
      });
      return;
    }

    window.disqus_config = function () {
      this.page.identifier = pageId;
      this.page.url = pageUrl;
      this.page.title = pageTitle;
    };

    if (document.getElementById('dsq-embed-script')) return;
    var s = document.createElement('script');
    s.id = 'dsq-embed-script';
    s.src = 'https://' + shortname + '.disqus.com/embed.js';
    s.setAttribute('data-timestamp', String(+new Date()));
    s.async = true;
    (document.head || document.body).appendChild(s);
  }

  if (window.LP) window.LP.add(init);
})();
