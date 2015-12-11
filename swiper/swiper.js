/**
 * @file 轮播组件
 * @see https://github.com/nolimits4web/Swiper
 *      https://github.com/thebird/Swipe
 *      http://www.javascriptkit.com/javatutors/touchevents3.shtml
 */

;(function (global) {

    /******* global variable ******/
    var arrProto = Array.prototype;
    var forEach = arrProto.forEach;
    var slice = arrProto.slice;
    var map = arrProto.map;

    var toString = Object.prototype.toString;

    /********* Util **********/
    /**
     * @param {string}      selector  CSS选择符
     * @param {HTMLElement} parent    父元素
     * @param {boolean}     all       是否选择所有
     * @return {NodeList}
     */
    var $ = function (selector, parent, all) {
        parent = parent || document;

        return parent[all ? 'querySelectorAll' : 'querySelector'](selector);
    };
    /**
     * 复制source属性到target，覆盖target同名属性
     * @param {Object}       target 目标对象
     * @param {Array.Object} source 源对象
     */
    var extend = function (target, source) {
        for (var i = 1, len = arguments.length; i < len; i++) {
            source = arguments[i];

            if (!source) {
                continue;
            }

            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
        }
    };
    /**
     * 给元素添加, 删除, toggle类
     * @param {HTMLElement}  elem       DOM元素
     * @param {string}  action          操作 add || remove || toggle
     * @param {Array.string} className  类名(数组或者字符串)
     *
     * @use
     *     - toggleClass(body, 'add', 'a', 'b', 'c');
     *     - toggleClass(body, 'toggle', ['a', 'b', 'c']);
     */
    var toggleClass = function (elem, action, className) {
        className = toString.call(className) === '[object Array]'
            ? className
            : slice.call(arguments, 1);

        map.call(className, function (cln) {
            elem.classList[action](cln);
        });
    };

    /******** 特性检测 ********/
    /**
     * @param {string} style css声明
     * @use
     *      - supportCSS('transition')
     * @return {boolean}
     */
    var supportCSS = function (style) {
        var htmlStyle = document.documentElement.style;
        var prefix = ['-webkit', '-moz', '-o', 'ms'];
        var humpString = [];

        var _toHumb = function (string) {
            return string.replace(/-(\w)/g, function ($0, $1) {
                return $1.toUpperCase();
            });
        };

        prefix.forEach(function (i, index) {
            humpString.push(_toHumb(i + '-' + style));
        });

        humpString.push(_toHumb(style));

        for (var i = 0, len = humpString.length; i < len; i++) {
            if (humpString[i] in htmlStyle) {
                return true;
            }
        }

        return false;
    };

    var browser = {
        touch: 'ontouchstart' in window,
        transitions: supportCSS('transition')
    };

    var vendor = (function (temp) {
        var vendors = ['t', 'webkitT', 'MozT', 'OT', 'msT'],
        dummyStyle = temp.style;

        for (var i = 0, len = vendors.length; i < len; i++) {
            var t = vendors[i] + 'ransform';

            if (t in dummyStyle) {
                return vendors[i].slice(0, vendors[i].length - 1);
            }
        }
        return false;
    })(document.createElement('div'));

    var trsEnd = (function (){
        var transitionEnd = {
            '': 'transitonend',
            'webkit': 'webkitTransitionEnd',
            'Moz': 'transitionend',
            'ms': 'transitionend',
            'O': 'otransitionend'
        };
        return transitionEnd[vendor];
    })();

    /******** 事件发射器 ********/
    var Events = {
        _events: {},

        /**
         * 事件绑定
         * @param {string}   action   事件名
         * @param {Function} listener 监听器
         * @param {Object}   context  作用域
         */
        on: function (action, listener, context) {
            if (!this._events[action]) {
                this._events[action] = [];
            }

            this._events[action].push(listener.bind(context || this));

            return this;
        },
        off: function (action) {
            if (this._events[action] && this._events[action].length > 0) {
                this._events[action] = [];
            }
        },
        once: function () {

        },
        trigger: function (action) {
            var params = slice.call(arguments, 1);
            var listeners = this._events[action];

            if (listeners && listeners.length) {
                listeners.forEach(function (listener, index) {
                    listener.apply(null, params);
                });
            }

            else {
                console.log('no listener');
            }
        }
    };

    /******** touch ********/
    /**
     * @param {HTMLElement}  touchsurface           要绑定事件的容器
     * @param {Object}       ctx                    函数的上下文
     * @param {Object}       options                配置
     * @param {number}       options.threshold      最小滑动距离
     * @param {number}       options.restraint      垂直方向最大滑动距离
     * @param {number}       options.allowedTime    允许的滑动时间
     * @param {boolean}      options.disableScroll  是否禁用滚动, 阻止系统滚动发生
     */
    function ontouch(touchsurface, ctx, options) {
        var dir;
        var startX;
        var startY;
        var startTime;

        var distX;
        var distY;

        var threshold = options && options.threshold || 100;
        var restraint = options && options.restraint || 100;
        var allowedTime = options && options.allowedTime || 800;

        touchsurface.addEventListener('touchstart', function (e) {
            if (options && options.disableScroll) {
                e.preventDefault();
            }

            var touchobj = e.changedTouches[0];
            startX = touchobj.pageX;
            startY = touchobj.pageY;
            startTime = +new Date();

            ctx.trigger('swipestart', e);

        }, false);

        touchsurface.addEventListener('touchmove', function (e) {
            if (options && options.disableScroll) {
                e.preventDefault();
            }

            var touchobj = e.changedTouches[0];

            distX = touchobj.pageX - startX;
            distY = touchobj.pageY - startY;

            if (Math.abs(distX) > Math.abs(distY)) {
                dir = (distX < 0) ? 'left' : 'right';

                ctx.trigger('move', e, dir, distX);
            }
            else {
                dir = (distY < 0) ? 'up' : 'down';

                ctx.trigger('move', e, dir, distY);
            }

        }, false);

        touchsurface.addEventListener('touchend', function (e) {
            e.preventDefault();

            var elapsedTime = +new Date() - startTime;

            if (elapsedTime <= allowedTime) {
                if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
                    ctx.trigger('swipe' + dir, e, distX);
                }
                else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
                    ctx.trigger('swipe' + dir, e, distY);
                }
                else {
                    ctx.trigger('release', e, (dir === 'left' || dir === 'right') ? distX : distY);
                }
            }
            else {
                ctx.trigger('release', e,  (dir === 'left' || dir === 'right') ? distX : distY);
            }

        }, false);
    }

    /**
     * @consructor
     * @param {Object}        options                 配置
     * @param {HTMLElement}   options.container       滑动的容器
     * @param {HTMLElement}   options.nav             指示位置的圈圈
     * @param {number}        options.cur             当前面板索引
     * @param {boolean}       options.direction       滑动方向，默认是向左
     * @param {number}        options.isAni           是否开启CSS3动画
     * @param {boolean}       options.loop            是否循环播放
     * @param {boolean}       options.aniTime         动画时间
     * @param {number}        options.autoplay        是否自动播放，是的话指定间隔时长，否的话false
     */
    function Swiper(options) {
        var defaults = {
            container: null,
            nav: null,
            cur: 0,
            direction: 'left',
            isAni: true,
            loop: false,
            autoplay: 2000,
            aniTime: 400,
            proportion: .5
        };

        extend(this, defaults, options);
    }

    Swiper.prototype = {
        init: function () {
            var container = this.container;

            var slides = this.slides = container && container.children;

            var realLen = this.realLen = slides.length;

            // 容器不存在 OR 容器不存在子元素 OR 不支持touch
            if (!browser.touch || !realLen) {
                return;
            }

            forEach.call(slides, function (slide, index) {
                slide.setAttribute('data-index', index);
            });

            this.bindEvents();

            this.repos();

            this.start();
        },

        toggleNav: function (cur) {
            if (!this.nav) {
                return;
            }

            var dots = $('i', this.nav, true);

            var realLen = this.realLen;

            forEach.call(dots, function (item) {
                toggleClass(item, 'remove', 'active');
            });

            toggleClass(dots[cur % realLen], 'add', 'active');
        },

        repos: function () {
            var me = this;

            var cur = this.cur;

            var container = this.container;

            var slides = this.slides;

            // 只有一个slide
            if (slides.length < 2) {
                return;
            }

            // getBoundingClientRect(): border + padding + width, 返回top, right, bottom, left, width, heihgt
            var width = this.width = container.getBoundingClientRect().width || container.offsetWidth;

            // loop状态&&子元素个数小于三个，无法循环轮播，需要复制已有节点
            if (this.loop && slides.length < 3) {
                container.appendChild(slides[0].cloneNode(true));
                container.appendChild(slides[1].cloneNode(true));

                this.slides = slides = container.children;
            }

            this.slidePos = new Array(slides.length);

            // 以 this.cur 为界, 小于cur的移到-width, 大于cur的移到width
            forEach.call(slides, function (slide, index) {
                var dist = index < cur ? -width : (index > cur ? width : 0);

                me._translate(index, dist, 0);
            });

            if (this.loop) {
                this._translate(this.circle(cur - 1), -width, 0);
                this._translate(this.circle(cur + 1), width, 0);
            }

            if (this.nav) {

                this.nav.innerHTML = new Array(slides.length + 1).join('<i></i>');

                this.nav.querySelectorAll('i')[cur].classList.add('active');
            }
        },

        circle: function (num) {
            var len = this.slides.length;

            if (num < 0) {
                // return this.len - 1;
                return len + num;
            }

            else if (num >= len) {
                // return 0;
                return num - len;
            }

            return num;
        },

        // 设置了autoplay, 才执行
        start: function () {
            console.log('start')
            if (typeof this.autoplay === 'number') {
                this.timer = setTimeout(
                    this[this.direction === 'right' ? 'prev' : 'next'].bind(this),
                    this.autoplay
                );
            }
        },

        // 停止自动播放
        stop: function () {

            clearTimeout(this.timer);

            this.timer = null;
        },

        next: function () {
            // 处理循环
            if (this.loop) {
                this.go(this.cur + 1);
            }
            else if (this.cur < this.slides.length - 1) {
                this.go(this.cur + 1);
            }
        },

        prev: function () {
            // 处理循环
            if (this.loop) {
                this.go(this.cur - 1);
            }

            else if (this.cur > 0) {
                this.go(this.cur - 1);
            }
        },

        go: function (cur) {
            var old = this.cur;

            if (cur === old) {
                return;
            }

            // -1前进 1后退
            var dir = cur > old ? -1 : 1;

            cur = this.circle(cur);

            this._translate(old, dir * this.width, this.aniTime);
            this._translate(cur, 0, this.aniTime);

            if (this.loop) {
                this._translate(this.circle(cur - dir), -dir * this.width, 0);
            }

            this.cur = cur;
        },

        _translate: function (cur, dist, duration) {

            this.slidePos[cur] = dist;

            this._move(cur, dist, duration);
        },

        _move: function (cur, dist, duration) {
            var slide = this.slides[cur];

            var style = slide && slide.style;

            if (!style) {
                return;
            }

            // isAni && 支持transition动画，则开启动画
            if (this.isAni && browser.transitions) {
                style.webkitTransform =
                style.transform = 'translate(' + dist + 'px, 0) translateZ(0)';

                style.webkitTransitionDuration =
                style.transitionDuration = duration + 'ms';
            }
            else {

            }
        },

        transitionEnd: function (e) {
            var cur = this.cur;

            if (parseInt(e.target.getAttribute('data-index'), 10) === cur % this.realLen) {

                this.start();

                this.trigger('pagechange', cur, this.slides[cur]);
            }
        },

        bindEvents: function () {
            var container = this.container;

            var me = this;

            ['transitonend', 'webkitTransitionEnd', 'otransitionend'].forEach(function (type) {
                container.addEventListener(type, me.transitionEnd.bind(me), false);
            });

            this
                .on('swipestart', function () {
                })
                .on('move', function (e, dir, dist) {
                    if (dir === 'left' || dir === 'right') {
                        e.preventDefault();

                        this.stop();

                        var cur = this.cur;

                        var slidePos = this.slidePos;

                        if (!this.loop) {
                            dist = dist / ((cur === 0 && dir === 'right') || (cur === this.slides.length - 1 && dir === 'left') ? Math.abs(dist) + 1 : 1);
                            this._move(cur - 1, slidePos[cur - 1] + dist, 0);
                            this._move(cur, slidePos[cur] + dist, 0);
                            this._move(cur + 1, slidePos[cur + 1] + dist, 0);
                        }
                        else {
                            this._move(this.circle(cur - 1), slidePos[this.circle(cur - 1)] + dist, 0);
                            this._move(cur, slidePos[cur] + dist, 0);
                            this._move(this.circle(cur + 1), slidePos[this.circle(cur + 1)] + dist, 0);
                        }
                    }
                })
                .on('swipeleft', function (e, dist) {
                    console.log('swipeleft');
                    this.next();
                    // 没懂这句话干嘛的
                    // this._move(this.circle(this.cur - 2), this.slidePos[this.circle(this.cur - 2)], 0);
                })
                .on('swiperight', function (e, dist) {
                    console.log('swiperight');
                    this.prev();
                    // this._move(this.circle(this.cur + 2), this.slidePos[this.circle(this.cur + 2)], 0);
                })
                .on('release', function (e, dist) {
                    var cur = this.cur;

                    var aniTime = this.aniTime;

                    var width = this.width;

                    if (Math.abs(dist) >= width * this.proportion) {
                        this.trigger(dist < 0 ? 'swipeleft' : 'swiperight');
                        return;
                    }

                    if (!this.loop) {
                        this._move(cur - 1, -width, aniTime);
                        this._move(cur, 0, aniTime);
                        this._move(cur + 1, width, aniTime);
                    }
                    else {
                        this._move(this.circle(cur - 1), -width, aniTime);
                        this._move(cur, 0, this.aniTime);
                        this._move(this.circle(cur + 1), width, aniTime);
                    }
                })
                .on('pagechange', function (cur, elem) {
                    me.toggleNav(cur);
                });

            ontouch(container, this);
        }
    };

    extend(Swiper.prototype, Events);

    global.Swiper = Swiper;

})(this);
