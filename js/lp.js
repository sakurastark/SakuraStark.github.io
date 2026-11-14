/* 页面初始化注册表
 * 每个页面脚本把自己的初始化函数 LP.add(fn) 注册进来；
 * 首次加载和 pjax 换页之后都调 LP.run() 跑一遍。
 * 单个 init 报错不会影响其它的（就地 try/catch）。
 */
(function () {
  'use strict';
  if (window.LP) return;

  window.LP = {
    inits: [],
    add: function (fn) {
      if (typeof fn === 'function') this.inits.push(fn);
      return fn;
    },
    run: function () {
      for (var i = 0; i < this.inits.length; i++) {
        try {
          this.inits[i]();
        } catch (e) {
          if (window.console) console.warn('[LP] init #' + i + ' 失败：', e);
        }
      }
    }
  };
})();
