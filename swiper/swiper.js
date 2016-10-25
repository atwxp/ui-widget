/**
 * @file   swiper widget
 * @author wxp201013@163.com
 */

define(function (require, exports, module) {

    var util = require('common/lib/util');
    var Emitter = require('common/lib/emitter');

    var ontouch = require('./ontouch');

    var slice = Array.prototype.slice;

    /**
     * swiper
     *
     * @param {Object}        options                 配置
     * @param {DOM}           options.container       滑动的容器
     * @param {DOM}           options.nav             指示位置的圈圈
     * @param {number}        options.cur             当前面板索引
     * @param {boolean}       options.direction       滑动方向，默认是向左
     * @param {boolean}       options.loop            是否循环播放
     * @param {boolean}       options.aniTime         动画时间
     * @param {number}        options.autoplay        是否自动播放，是的话指定间隔时长，否的话false
     * @param {number}        options.proportion      滑动的阈值
     * @param {boolean}       options.allowGesture    是否开启手势滑动
     */
    function Swiper(options) {
        this.options = {
            container: null,
            nav: null,
            cur: 0,
            direction: 'left',
            loop: false,
            autoplay: 2000,
            aniTime: 400,
            proportion: .5,
            allowGesture: true,
            initStart: true,
            type: '',
            preload: 0,
            dataSrc: 'data-src'
        };

        util.extend(this.options, options);

        this.init();
    }

    Emitter.enable(Swiper.prototype);

    Swiper.prototype.init = function () {
        var options = this.options;

        options.allowGesture = (('ontouchstart' in window) || window.DocumentTouch
                && document instanceof window.DocumentTouch)
                && options.allowGesture;

        var container = this.container = options.container;

        this.nav = options.nav;
        this.oldCur = this.cur = options.cur;

        this.slides = container && container.children;
        this.realLen = this.slides && this.slides.length;

        // 容器不存在 OR 容器不存在子元素
        if (!container || !this.realLen) {
            return;
        }

        var rect = container.getBoundingClientRect();
        this.width = rect.width || container.offsetWidth;
        this.height = rect.height || container.offsetHeight;

        // todo: 不支持transition 怎么处理？
        // if (!util.supportCSS('transition') || this.realLen === 1) {
        //     this.container.classList.add('visible');
        //     return;
        // }

        util.forEach(slice.call(this.slides), function (slide, index) {
            slide.setAttribute('data-index', index);
        });

        this.bindEvents();

        if (options.initStart) {
            this.repos();

            this.start();
        }
    };

    Swiper.prototype.bindEvents = function () {
        var container = this.container;
        var options = this.options;

        var me = this;

        util.forEach(['transitonend', 'webkitTransitionEnd', 'otransitionend'], function (type) {
            container.addEventListener(type, me.transitionEnd.bind(me), false);
        });

        window.addEventListener('resize', util.throttle(50, this.resize.bind(this)), false);
        window.addEventListener('orientationchange', util.throttle(50, this.resize.bind(this)), false);

        this.on('pagechange', function (evt, cur, elem) {
            me.toggleNav(cur);

            // preload img
            if (options.type === 'img') {
                me.preloadImg();
            }
        });

        if (!options.allowGesture) {
            return;
        }

        this
            .on('touchstart', function () {
                this.isScroll = false;
            })
            .on('move', function (evt, touchEvt, dir, dist) {
                if (!this.isScroll && (dir === 'left' || dir === 'right')) {
                    this.isScroll = true;
                }

                if (this.isScroll) {
                    touchEvt.preventDefault();

                    this.stop();

                    var cur = this.cur;
                    var options = this.options;
                    var slidePos = this.slidePos;

                    if (options.loop) {
                        this._move(this.circle(cur - 1), slidePos[this.circle(cur - 1)] + dist, 0);
                        this._move(cur, slidePos[cur] + dist, 0);
                        this._move(this.circle(cur + 1), slidePos[this.circle(cur + 1)] + dist, 0);
                    }
                    else {
                        dist = dist / (
                            (cur === 0 && dir === 'right') || (cur === this.slides.length - 1 && dir === 'left')
                                ? Math.abs(dist) + 1 : 1);
                        this._move(cur - 1, slidePos[cur - 1] + dist, 0);
                        this._move(cur, slidePos[cur] + dist, 0);
                        this._move(cur + 1, slidePos[cur + 1] + dist, 0);
                    }
                }
            })
            .on('swipeleft', function (evt, touchEvt, dist) {
                if (!this.isScroll) {
                    return;
                }

                var options = this.options;

                this.next();

                if (options.loop) {
                    this._move(this.circle(this.cur - 2), this.slidePos[this.circle(this.cur - 2)], 0);
                }
            })
            .on('swiperight', function (evt, touchEvt, dist) {
                if (!this.isScroll) {
                    return;
                }

                var options = this.options;

                this.prev();

                if (options.loop) {
                    this._move(this.circle(this.cur + 2), this.slidePos[this.circle(this.cur + 2)], 0);
                }
            })
            .on('release', function (evt, touchEvt, dist) {
                if (!this.isScroll) {
                    return;
                }

                var cur = this.cur;
                var width = this.width;
                var options = this.options;
                var aniTime = options.aniTime;

                if (Math.abs(dist) >= width * options.proportion) {
                    this.trigger(dist < 0 ? 'swipeleft' : 'swiperight');
                    return;
                }

                if (!options.loop) {
                    this._move(cur - 1, -width, aniTime);
                    this._move(cur, 0, aniTime);
                    this._move(cur + 1, width, aniTime);
                }
                else {
                    this._move(this.circle(cur - 1), -width, aniTime);
                    this._move(cur, 0, aniTime);
                    this._move(this.circle(cur + 1), width, aniTime);
                }
            })

        ontouch(container, this, options);
    };

    Swiper.prototype.preloadImg = function () {

        var cur = this.cur;
        var imgs = this.slides;
        var total = imgs.length;

        var options = this.options;
        var dataSrc = options.dataSrc;

        var me = this;

        var size = {
            w: this.width,
            h: this.height
        };

        var loadImage = function (elem, callback) {
            if (elem.lazyload) {
                return;
            }

            var img = elem.querySelector('img');

            elem.lazyload = 'loading';

            img.addEventListener('load', function () {

                me.fire('preload', [img, size]);

                elem.classList.add('contain');

                elem.lazyload = 'load';

            }, false);

            img.addEventListener('error', function () {
                elem.lazyload = null;
            }, false);

            img.src = img.getAttribute(dataSrc);
        };

        var amend = function (num, len) {
            if (num < 0) {
                return 0;
            }

            else if (num >= len) {
                return len - 1;
            }

            return num;
        };

        loadImage(imgs[amend(cur, total)]);
        for (var i = 1; i <= options.preload; i++) {
            loadImage(imgs[amend(cur - i, total)]);

            loadImage(imgs[amend(cur + i, total)]);
        }
    };

    Swiper.prototype.toggleNav = function (cur) {
        if (!this.nav) {
            return;
        }

        var dots = this.nav.querySelectorAll('i');

        var realLen = this.realLen;

        util.forEach(slice.call(dots), function (item) {
            item.classList.remove('active');
        });

        dots[cur % realLen].classList.add('active');
    };

    Swiper.prototype.repos = function () {
        var options = this.options;

        var cur = this.cur;
        var slides = this.slides;
        var container = this.container;

        var me = this;

        // getBoundingClientRect(): border + padding + width,
        // 返回top, right, bottom, left, width, heihgt
        var width = this.width;

        if (!options.direction) {

            util.forEach(slice.call(this.slides), function (slide, index) {
                me._fadeInOut(index, parseInt(index, 10) !== cur ? 0 : 1, 0);
            });
        }
        else {
            // loop状态&&子元素个数小于三个，无法循环轮播，需要复制已有节点
            if (options.loop && this.realLen < 3) {
                container.appendChild(slides[0].cloneNode(true));
                container.appendChild(slides[1].cloneNode(true));

                this.slides = slides = container.children;
            }

            this.slidePos = new Array(slides.length);

            // 以 this.cur 为界, 小于cur的移到-width, 大于cur的移到width
            util.forEach(slice.call(this.slides), function (slide, index) {
                var dist = index < cur ? -width : (index > cur ? width : 0);

                me._translate(index, dist, 0);
            });

            if (options.loop) {
                this._translate(this.circle(cur - 1), -width, 0);
                this._translate(this.circle(cur + 1), width, 0);
            }

            if (this.nav) {
                this.nav.innerHTML = new Array(this.realLen + 1).join('<i></i>');
                this.nav.querySelectorAll('i')[cur].classList.add('active');
            }
        }

        this.container.classList.add('visible');
    };

    Swiper.prototype.resize = function () {

        var options = this.options;

        if (!options.direction) {
            return;
        }

        var container = this.container;
        var width = container.getBoundingClientRect().width || container.offsetWidth;

        if (width === this.width) {
            return;
        }

        this.width = width;

        var cur = this.cur;
        var slides = this.slides;
        var me = this;

        this.slidePos = new Array(slides.length);

        // 以 this.cur 为界, 小于cur的移到-width, 大于cur的移到width
        util.forEach(slice.call(this.slides), function (slide, index) {
            var dist = index < cur ? -width : (index > cur ? width : 0);

            me._translate(index, dist, 0);
        });

        if (options.loop) {
            this._translate(this.circle(cur - 1), -width, 0);
            this._translate(this.circle(cur + 1), width, 0);
        }
    };

    Swiper.prototype._fadeInOut = function (index, opacity, time) {
        var slide = this.slides[index];

        var style = slide && slide.style;

        if (!style) {
            return;
        }

        style.webkitTransitionDuration = style.transitionDuration = time + 'ms';
        style.opacity = opacity;
    };

    Swiper.prototype.circle = function (num) {
        var len = this.slides.length;

        if (num < 0) {
            return len + num;
        }

        else if (num >= len) {
            return num - len;
        }

        return num;
    };

    Swiper.prototype.start = function () {
        var options = this.options;

        this.stop();

        if (!options.initStart) {
            this.repos();
            options.initStart = true;
        }

        if (!this.inited) {
            this.fire('pagechange', [this.cur, this.slides.length, this.slides[this.cur]]);
            this.inited = true;
        }

        if (typeof options.autoplay === 'number') {
            this.timer = setTimeout(
                this[
                    (options.direction && options.direction === 'right')
                    ? 'prev' : 'next'
                ].bind(this),
                options.autoplay
            );
        }

    };

    Swiper.prototype.stop = function () {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    };

    Swiper.prototype.next = function () {
        var options = this.options;

        if (options.loop || this.cur < this.slides.length - 1) {
            this.go(this.cur + 1);
        }
    };

    Swiper.prototype.prev = function () {
        var options = this.options;

        if (options.loop || this.cur > 0) {
            this.go(this.cur - 1);
        }
    };

    Swiper.prototype.go = function (cur) {
        var options = this.options;
        var aniTime = options.aniTime;

        var old = this.oldCur = this.cur;

        if (cur === old) {
            return;
        }

        // -1前进 1后退
        var dir = cur > old ? -1 : 1;

        cur = this.circle(cur);

        if (!options.direction) {
            this._fadeInOut(old, 0, aniTime);
            this._fadeInOut(cur % this.realLen, 1, aniTime);
        }
        else {
            this._translate(old, dir * this.width, aniTime);
            this._translate(cur, 0, aniTime);

            if (options.loop) {
                this._translate(this.circle(cur - dir), -dir * this.width, 0);
            }
        }

        this.cur = cur;
    };

    Swiper.prototype._translate = function (cur, dist, duration) {

        this.slidePos[cur] = dist;

        this._move(cur, dist, duration);
    };

    Swiper.prototype._move = function (cur, dist, duration) {
        var slide = this.slides[cur];

        var style = slide && slide.style;

        if (!style) {
            return;
        }

        style.webkitTransitionDuration = style.transitionDuration = duration + 'ms';
        style.webkitTransform = style.transform = 'translate(' + dist + 'px, 0) ' + 'translateZ(0)';
    };

    Swiper.prototype.transitionEnd = function (e) {
        var cur = this.cur;

        if (
            parseInt(e.target.getAttribute('data-index'), 10) === cur % this.realLen
            && this.oldCur !== this.cur
        ) {

            this.start();

            this.fire('pagechange', [cur, this.slides.length, this.slides[cur]]);

            this.oldCur = this.cur;
        }
    };

    module.exports = Swiper;
});
