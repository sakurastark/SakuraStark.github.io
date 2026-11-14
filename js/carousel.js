/********** 首页轮播（只有首页有 .postCarousel 时才跑） **********/
(function () {
    'use strict';

    function init() {
        var carouselList = document.getElementsByClassName('postCarousel');
        var postList = document.getElementsByClassName('postList')[0];
        if (!carouselList.length || !postList) return;

        // 上一次留下的自动轮播定时器要清掉，否则换页后会越积越多
        if (window.__lpCarouselTimer) {
            clearInterval(window.__lpCarouselTimer);
            window.__lpCarouselTimer = null;
        }

        // 把第一张复制到末尾，实现无缝循环
        var firstP = carouselList[0].cloneNode(true);
        postList.appendChild(firstP);

        postList.style.width = 100 * carouselList.length + 'vw';
        var currentPictureIndex = 0;
        var allDots = document.getElementsByClassName('navDot');
        var preIndex = allDots.length - 1;
        var widthOfCarousel = postList.clientWidth / carouselList.length;
        var container = document.getElementsByClassName('carousel-container')[0];
        if (!container) return;
        var prevPic = container.getElementsByClassName('fa-chevron-left')[0];
        var nextPic = container.getElementsByClassName('fa-chevron-right')[0];

        // 指示点居中
        if (typeof isCenter !== 'undefined' && isCenter) {
            var Dots = document.getElementsByClassName('navDots')[0];
            if (Dots) Dots.style.left = (window.innerWidth - Dots.offsetWidth) / 2 + 'px';
        }

        window.onresize = function () {
            postList.style.width = 100 * carouselList.length + 'vw';
            widthOfCarousel = postList.clientWidth / carouselList.length;
            if (typeof isCenter !== 'undefined' && isCenter) {
                var dots = document.getElementsByClassName('navDots')[0];
                if (dots) dots.style.left = (window.innerWidth - dots.offsetWidth) / 2 + 'px';
            }
        };

        function setDotClass() {
            if (allDots[preIndex] && allDots[preIndex].classList.contains('currentDot')) {
                allDots[preIndex].classList.remove('currentDot');
            }
            if (allDots[currentPictureIndex]) allDots[currentPictureIndex].classList.add('currentDot');
        }

        function setDotStyle() {
            if (currentPictureIndex >= carouselList.length - 1) {
                currentPictureIndex = 0;
                postList.style.left = 0;
            }
            for (var i = 0; i < allDots.length; i++) {
                allDots[i].style.backgroundColor = '';
            }
            setDotClass();
        }

        function autoCarousel() {
            window.__lpCarouselTimer = setInterval(function () {
                preIndex = currentPictureIndex;
                currentPictureIndex++;
                currentPictureIndex %= carouselList.length;
                move(postList, 'left', -widthOfCarousel * currentPictureIndex, 80, function () {
                    setDotStyle();
                });
            }, 6500);
        }

        setDotClass();

        for (var i = 0; i < allDots.length; i++) {
            allDots[i].num = i;
            allDots[i].onclick = function () {
                clearInterval(window.__lpCarouselTimer);
                preIndex = currentPictureIndex;
                currentPictureIndex = this.num;
                setDotStyle();
                move(postList, 'left', -widthOfCarousel * currentPictureIndex, 80, function () {
                    autoCarousel();
                });
            };
        }

        if (nextPic) {
            nextPic.onclick = function () {
                clearInterval(window.__lpCarouselTimer);
                preIndex = currentPictureIndex;
                currentPictureIndex++;
                currentPictureIndex %= carouselList.length;
                setDotStyle();
                move(postList, 'left', -widthOfCarousel * currentPictureIndex, 80, function () {
                    autoCarousel();
                });
            };
        }

        if (prevPic) {
            prevPic.onclick = function () {
                if (currentPictureIndex != 0) {
                    clearInterval(window.__lpCarouselTimer);
                    preIndex = currentPictureIndex;
                    currentPictureIndex--;
                    currentPictureIndex %= carouselList.length;
                    setDotStyle();
                    move(postList, 'left', -widthOfCarousel * currentPictureIndex, 80, function () {
                        autoCarousel();
                    });
                }
            };
        }

        autoCarousel();
    }

    if (window.LP) window.LP.add(init);
})();
