/********** 文章页：分享位置 / 打赏二维码 / 目录 / 代码块 **********/
(function () {
    'use strict';

    function byId(id) { return document.getElementById(id); }

    /* ---- 分享栏位置：窄屏挪到标题下面 ---- */
    function makeShareLayout() {
        var share = byId('share-col');
        var shareIn = byId('shareButtons');
        var midCol = byId('mid-col');
        var postTitles = byId('titles');
        var postDate = document.getElementsByClassName('date')[0];
        var postInformation = byId('post-information');
        var firstLine = byId('first-line');
        if (!share || !midCol || !postTitles || !postDate) return;

        var sharePos = 1; // 1 = 在正文外侧，0 = 挪到标题下面

        function setSharePos() {
            if (window.innerWidth < 940) {
                if (sharePos == 1) {
                    insertAfter(share, postTitles);
                    if (postInformation) postInformation.appendChild(postDate);
                    sharePos = 0;
                    modifyClass(shareIn, 'newShare', 1);
                }
            } else {
                if (sharePos == 0) {
                    midCol.parentNode.insertBefore(share, midCol);
                    modifyClass(shareIn, 'newShare', 0);
                    if (firstLine) firstLine.appendChild(postDate);
                    sharePos = 1;
                }
            }
        }

        setSharePos();
        window.onresize = setSharePos;
    }

    /* ---- 打赏二维码切换 ---- */
    function makeDonate() {
        var qrButton = document.getElementsByClassName('qrButton')[0];
        var auInfo = document.getElementsByClassName('au-info')[0];
        if (!qrButton) return;

        var payImg = document.getElementsByClassName('pay-code')[0];
        var payDiv = byId('payment-code');
        var isQB = true;

        qrButton.onclick = function () {
            if (isQB) {
                changeToPerson(qrButton);
                isQB = false;
                if (auInfo) auInfo.style.display = 'none';
                if (payDiv) payDiv.style.display = 'block';
            } else {
                changeToQrcode(qrButton);
                isQB = true;
                if (auInfo) auInfo.style.display = 'block';
                if (payDiv) payDiv.style.display = 'none';
            }
        };

        var paymentButtons = document.getElementsByClassName('paymentButtons');
        Array.prototype.forEach.call(paymentButtons, function (payBt) {
            payBt.onclick = function () {
                Array.prototype.forEach.call(paymentButtons, function (otherBt) {
                    modifyClass(otherBt, 'selected', 0);
                });
                modifyClass(payBt, 'selected', 1);
                var qrCodeUrl = '/img/';
                if (payBt.id == 'alipay') qrCodeUrl += 'alipay.jpg';
                if (payBt.id == 'wechat') qrCodeUrl += 'wechat.jpg';
                if (payBt.id == 'zelle') qrCodeUrl += 'zelle.jpg';
                if (payImg) payImg.src = qrCodeUrl;
            };
        });
    }

    /* ---- 目录 ---- */
    function makeToc(postContent) {
        var tocEl = byId('sidebar-toc');
        if (!tocEl) return;

        // 给每个标题一个唯一 id，tocbot 才能跳
        var i = 0;
        for (var hn = 1; hn <= 6; hn++) {
            var heading = postContent.getElementsByTagName('h' + hn);
            for (var j = 0; j < heading.length; j++) {
                heading[j].id = 'last-' + i;
                i++;
            }
        }

        if (typeof tocbot === 'undefined') return;
        tocbot.init({
            tocSelector: '#tocs',
            contentSelector: '#post-content',
            headingSelector: 'h1, h2, h3, h4, h5'
        });
        numberToc();
        // 换页后目录是新的，把吸顶状态和基准位置重置
        tocEl.style.cssText = '';
        var h = 0,
            y = tocEl;
        while (y) {
            h += y.offsetTop;
            y = y.offsetParent;
        }
        tocEl.setAttribute('data-top', String(h));
    }

    /* ---- 给目录加 2.1.1.3. 这样的层级编号 ----
     * 算法照搬 Hexo 自带的 toc() helper（Butterfly 用的就是那个），
     * 所以同一篇文章在两边看到的编号完全一致：
     *   - 每级单独计数，遇到更深层标题时把深层计数清零
     *   - 从「文章第一个标题的级别」开始拼，文章从 h2 起也能得到 1. / 1.1.
     */
    function numberToc() {
        var links = document.querySelectorAll('#tocs a.toc-link');
        if (!links.length) return;

        var last = [0, 0, 0, 0, 0, 0];
        var firstLevel = 0;

        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            if (link.querySelector('.toc-number')) continue;

            var m = /node-name--H([1-6])/.exec(link.className);
            var level = m ? parseInt(m[1], 10) : 1;

            last[level - 1] += 1;
            for (var r = level; r <= 5; r++) last[r] = 0;
            if (!firstLevel) firstLevel = level;

            var num = '';
            for (var k = firstLevel - 1; k < level; k++) num += last[k] + '.';

            var span = document.createElement('span');
            span.className = 'toc-number';
            span.textContent = num;
            link.insertBefore(span, link.firstChild);
        }
    }

    /* ---- 代码块：语言标识 + 复制/全屏按钮 ---- */
    function makeCodeBlocks() {
        var codes = document.getElementsByClassName('highlight');
        for (var i = 0; i < codes.length; i++) {
            AddLanguageName(codes[i], i);
        }
    }

    function AddLanguageName(pre, index) {
        var language = (pre.className.split(' ')[1] || 'text').toUpperCase();
        if (language == 'HLJS') language = 'TEXT';
        if (language == 'JS') language = 'JavaScript';
        if (language == 'MD') language = 'MarkDown';
        if (language == 'PY') language = 'PYTHON';

        var Figcaption = pre.querySelector('figcaption');
        if (Figcaption != null) {
            pre.removeChild(Figcaption);
        }

        var code = pre.children[0].children[0].children[0].children[1];
        if (!code) return;
        code.setAttribute('class', 'codeblock-content');
        code.setAttribute('id', 'codeblock-' + index.toString());

        var preHeader = document.createElement('div');
        preHeader.setAttribute('class', 'code-block-header');
        var langName = document.createElement('span');
        langName.setAttribute('class', 'code-lang');
        langName.innerHTML = language;

        var codeblockButtons = document.createElement('span');
        codeblockButtons.className = 'codeblock-buttons';
        codeblockButtons.innerHTML =
            '<span class="code-copy-button" data-index="' + index + '"><i class="fa-solid fa-copy"></i></span>';

        var fullscreenBtn = document.createElement('span');
        fullscreenBtn.setAttribute('class', 'code-copy-button');
        fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';

        codeblockButtons.appendChild(fullscreenBtn);
        preHeader.appendChild(langName);
        if (Figcaption) {
            while (Figcaption.firstChild) {
                Figcaption.firstChild.setAttribute('class', 'code-info');
                preHeader.appendChild(Figcaption.firstChild);
            }
        }
        preHeader.appendChild(codeblockButtons);

        pre.parentNode.insertBefore(preHeader, pre);
        setCodeFullScreen(preHeader, pre, fullscreenBtn);
    }

    function setCodeFullScreen(preHead, codeblock, btn) {
        btn.addEventListener('click', function () {
            if (codeblock.classList.contains('code-block-fullscreen')) {
                codeblock.classList.remove('code-block-fullscreen');
                preHead.classList.remove('code-head-fullscreen');
                document.documentElement.classList.remove('code-block-fullscreen-html-scroll');
            } else {
                codeblock.classList.add('code-block-fullscreen');
                preHead.classList.add('code-head-fullscreen');
                document.documentElement.classList.add('code-block-fullscreen-html-scroll');
            }
        });
    }

    /* ---- 引用块里的 vquote 挪到外层 ---- */
    function fixVquote() {
        var vquoteElements = document.querySelectorAll('.vquote');
        Array.prototype.forEach.call(vquoteElements, function (vquoteElement) {
            var parentElement = vquoteElement.parentElement;
            if (parentElement && parentElement.parentElement) {
                parentElement.parentElement.insertBefore(vquoteElement, parentElement.nextSibling);
            }
        });
    }

    function init() {
        var postContent = byId('post-content');
        if (!postContent || !byId('mid-col')) return; // 不是文章页

        makeShareLayout();
        makeDonate();
        makeToc(postContent);
        makeCodeBlocks();
        fixVquote();

        // 分享按钮由 social-share.js 生成，它只在 DOM ready 时自动跑一次，
        // pjax 换页后这里补一次（内部有 el.initialized 判断，重复调用安全）
        if (typeof socialShare === 'function') {
            try { socialShare('.social-share, .share-component'); } catch (e) {}
        }
    }

    if (window.LP) window.LP.add(init);
})();
