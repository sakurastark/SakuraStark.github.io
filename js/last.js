/********* 头部菜单 / 搜索 / 滚动：pjax 每次换页都要重跑 *********/

/****** add or remove a class  *************/
function modifyClass(obj, className, op) { // op = 1 add; op == 0 remove
    if (!obj) return;
    if (op == 1) {
        obj.classList.add(className);
    } else if (obj.classList.contains(className)) {
        obj.classList.remove(className);
    }
}

/******* insert After **********/
function insertAfter(newElement, targetElement) {
    var parent = targetElement.parentNode;
    if (parent.lastChild == targetElement) {
        parent.appendChild(newElement, targetElement);
    } else {
        parent.insertBefore(newElement, targetElement.nextSibling);
    }
}

(function () {
    'use strict';

    var searchLoaded = false;
    var scrollBound = false;

    function byId(id) { return document.getElementById(id); }

    /******** 滚动：菜单变底色 + 目录吸顶（只绑一次） ********/
    function bindScroll() {
        if (scrollBound) return;
        scrollBound = true;
        window.addEventListener('scroll', function () {
            var menuOuter = byId('menu-outer');
            if (menuOuter) {
                if (window.scrollY > 0) menuOuter.classList.add('newMenuOuterColor');
                else menuOuter.classList.remove('newMenuOuterColor');
            }
            var toc = byId('sidebar-toc');
            if (!toc) return;
            var top = parseInt(toc.getAttribute('data-top') || '0', 10);
            if (!top) return;
            var s = document.body.scrollTop || document.documentElement.scrollTop;
            if (s > top - 100) {
                var col = byId('toc-col');
                var w = col ? col.offsetWidth : toc.offsetWidth;
                toc.style.cssText = 'position:fixed;top:50px;width:' + w + 'px';
            } else if (toc.style.cssText) {
                toc.style.cssText = '';
            }
        }, { passive: true });
    }

    /******** 消息弹窗示例（只有元素存在时才绑） ********/
    function bindMessageDemo() {
        if (typeof Message === 'undefined') return;
        var message = null;
        function demo(id, type, text, duration) {
            var el = byId(id);
            if (!el || el.getAttribute('data-lp-bound')) return;
            el.setAttribute('data-lp-bound', '1');
            el.addEventListener('click', function () {
                if (!message) message = new Message();
                message.show({ type: type, text: text, duration: duration, isClose: true });
            });
        }
        demo('test-info', 'info', '此路是我开，此树是我开，要想从此过，拿出买路钱！', 0);
        demo('test-warning', 'warning', '借贷有风险，不还钱小心被打！', 2000);
        demo('test-error', 'error', '您的余额不够，请速速去借钱！', 5000);
        demo('test-success', 'success', '您已交钱，放您通行！', 5000);
    }

    function init() {
        bindScroll();

        // clipboard.js 里直接用了全局 message，这里把它补上
        if (!window.message && typeof Message !== 'undefined') {
            window.message = new Message();
        }

        var nav = byId('nav');
        var menuOuter = byId('menu-outer');
        var menuIcon = document.getElementsByClassName('menu-icon')[0];

        // 换页后菜单恢复收起状态
        window.__menuOpened = false;
        if (nav) nav.classList.remove('newNav');
        if (menuOuter) menuOuter.classList.remove('newMenuOuter');

        if (menuIcon && nav && menuOuter && !menuIcon.getAttribute('data-lp-bound')) {
            menuIcon.setAttribute('data-lp-bound', '1');
            var lines = menuIcon.getElementsByTagName('li');
            menuIcon.onclick = function () {
                window.__menuOpened = !window.__menuOpened;
                var op = window.__menuOpened ? 1 : 0;
                modifyClass(lines[0], 'newFirstLine', op);
                modifyClass(lines[1], 'newSecondLine', op);
                modifyClass(lines[2], 'newThirdLine', op);
                modifyClass(nav, 'newNav', op);
                modifyClass(menuOuter, 'newMenuOuter', op);
            };
        }

        /****** go to top button ******/
        var backToTopButton = byId('back-to-top');
        if (backToTopButton) {
            backToTopButton.addEventListener('click', function () {
                document.body.scrollIntoView({ behavior: 'smooth' });
            });
        }

        /****** go to comments ******/
        var toCommentButton = byId('go-to-comment');
        var commentBox = byId('vcomment');
        if (toCommentButton && commentBox) {
            toCommentButton.addEventListener('click', function () {
                var height = 0,
                    t = commentBox;
                do {
                    height += t.offsetTop;
                    t = t.offsetParent;
                } while (t && t != document.body);
                window.scrollTo({ top: height - 80, behavior: 'smooth' });
            });
        }

        /********* search *********/
        var searchInput = byId('local-search-input');
        if (searchInput && !searchInput.getAttribute('data-lp-bound')) {
            searchInput.setAttribute('data-lp-bound', '1');
            searchInput.onclick = function () {
                if (searchLoaded) return;
                searchLoaded = true;
                if (typeof getSearchFile === 'function') getSearchFile();
            };
        }

        /******** 目录吸顶的基准位置 ********/
        var toc = byId('sidebar-toc');
        if (toc) {
            var h = 0,
                y = toc;
            while (y) {
                h += y.offsetTop;
                y = y.offsetParent;
            }
            toc.setAttribute('data-top', String(h));
            toc.style.cssText = '';
        }

        bindMessageDemo();
    }

    if (window.LP) window.LP.add(init);
})();
