define(function (require, exports, module) {

    var $ = require('dep/zepto');
    var Hammer = require('./hammer.js');

    /**
     * @constructor
     * @param {Object}   options             配置项
     * @param {DOM}      options.elem        数据源的容器，默认从容器的data-pics||data-pics2x获取,
     *                                       可以通过reloadImageSource()自定义数据源, 返回一个数组
     * @param {Array}    options.imgSource   图片集合
     * @param {number=}  options.proportion  超过这个比例才切换，否则弹回
     * @param {number=}  options.speed       动画时间(ms)
     * @param {boolean=} options.animate     是否开启切换动画
     * @param {boolean=} options.hasToolBar  是否显示工具条
     * @param {boolean=} options.hasMetaBar  是否显示信息条如图片描述，提供下载保存按钮等
     * @param {number=}  options.preload     预加载几张图片，默认加载当前图片的前后各1张, 以此例推
     * @param {number=}  options.zoomScale   使图片好看的附加缩放比例
     * @param {number=}  options.isFull      点击图片是否全屏还是关闭弹层
     */
    function ImageView(options) {
        var defaults = {
            elem: '',
            imgSource: [],
            proportion: .4,
            speed: 200,
            animate: true,
            hasToolBar: true,
            hasMetaBar: false,
            preload: 1,
            zoomScale: 1,
            isFull: true
        };

        extend(this, defaults, options);

        this.init();
    }

    ImageView.cid = 0;

    ImageView.prototype = {

        constructor: ImageView,

        /**
         * 初始化应用
         */
        init: function () {

            // 指定了elem, 重新获取图片源, 覆盖imgSource
            this.imgSource = (this.elem && this.reloadImageSource()) || this.imgSource;

            this.len = this.imgSource.length;

            // 生成模板
            this.initTpl();

            // 初始化位置
            this.initPos();

            // 绑定swipe事件
            this.bindEvent();
        },

        /**
         * 重新加载图片源
         *
         * @return {Array}
         */
        reloadImageSource: function () {
            return $(this.elem).data(window.devicePixelRatio > 1 ? 'pics2x' : 'pics').split(',');
        },

        /**
         * 初始化模板
         */
        initTpl: function () {
            // 遮罩层
            var maskDiv = this.mask = document.createElement('div');
            maskDiv.setAttribute('class', 'ui-mask');

            var maskWrapper = document.createElement('div');
            maskWrapper.setAttribute('class', 'wrapper');
            maskDiv.appendChild(maskWrapper);

            // 工具条外面的容器
            var wrapDiv = this.main = document.createElement('div');
            wrapDiv.setAttribute('class', 'ui-imageview');
            wrapDiv.setAttribute('cid', ImageView.cid++);
            maskWrapper.appendChild(wrapDiv);

            // 添加工具条
            if (this.hasToolBar) {
                this.toolbar = this.renderToolBar();
                wrapDiv.appendChild(this.toolbar);
            }

            // 添加信息条
            if (this.hasMetaBar) {
                this.metabar = this.renderMetaBar();
                wrapDiv.appendChild(this.metabar);
            }

            // 图片外面的容器
            var imageviewWrap = this.wrapper = document.createElement('ul');
            imageviewWrap.setAttribute('class', 'imageview-wrap');
            wrapDiv.appendChild(imageviewWrap);

            this.append();

            document.body.appendChild(maskDiv);
        },

        /**
         * 初始化时调整图片大小适应屏幕
         */
        initPos: function () {
            var viewW = window.innerWidth;
            var viewH = window.innerHeight;
            var self = this;

            this.viewport = {
                width: viewW,
                height: viewH
            };

            $(this.wrapper).find('.imageview-item').each(function (index, node) {
                node.style.width = viewW + 'px';
                node.style.height = viewH + 'px';

                var img = node.querySelector('img');
                img && imageResizeToCenter(img, self.viewport, self.zoomScale);
            });

            this.wrapper.style.width = viewW * this.len + 'px';
        },

        /**
         * 事件绑定
         */
        bindEvent: function () {
            var events = 'release drag swipeleft swiperight tap';
            var self = this;

            this.hammer = new Hammer(self.wrapper, {dragLockToAxis: true})
                .on(events, this.eventTouchHandler.bind(this));

            $(this.wrapper).on('touchstart', function (e) {
                e.preventDefault();
            });

            // 定义了工具条
            if (this.hasToolBar) {
                $(this.toolbar).find('[data-role="back"]').on('click', function (e) {
                    e.preventDefault();
                    self.hide();
                });

                // 同步工具栏中的文字
                $(this.toolbar).on('pagechange', function (e, index) {
                    this.querySelector('[data-role="curPic"]').innerHTML = index + 1;
                });
            }

            // 随窗口resize而调整
            $(window).on('resize', function (e) {
                self.initPos();
            });
        },

        /**
         * 加载指定索引的图片
         *
         * @param {number} pos 图片的索引
         */
        loadImage: function (pos) {
            if (pos < 0 || pos >= this.len) {
                return;
            }

            var node = this.wrapper.querySelectorAll('.imageview-item')[pos];
            var self = this;

            // 未加载图片
            if (node && parseInt(node.getAttribute('data-load'), 10) === 0) {

                var img = document.createElement('img');
                img.src = this.imgSource[pos];
                img.style.display = 'none';

                img.onload = function () {
                    this.onload = null;

                    node.setAttribute('data-load', 1);

                    imageResizeToCenter(img, self.viewport);

                    $(node).html(img);

                    img.style.display = '';
                };
            }
        },

        /**
         * 手势事件处理
         *
         * @param {Object} ev 事件对象
         */
        eventTouchHandler: function (ev) {
            var gesture = ev.gesture;

            gesture.preventDefault();

            switch (ev.type) {
                case 'drag':
                    var direction = gesture.direction;
                    var index = this.index;

                    if ('left' === direction || 'right' === direction) {
                        var length = this.len;

                        // stick to the finger
                        var dragOffset = ((100 / this.viewport.width) * gesture.deltaX) / length;

                        // slow down at the first and last pane
                        if (
                            (index === 0 && direction === 'right')
                            || (index === length - 1 && direction === 'left')
                        ) {
                            dragOffset *= 0.4;
                        }

                        // switch without animate
                        this.move(-index / length * 100 + dragOffset);
                    }
                    break;

                case 'swipeleft':
                    this.next();
                    break;

                case 'tap':
                    if (typeof this.isFull === 'boolean') {
                        this.isFull ? this.full() : this.hide();
                    }
                    break;

                case 'swiperight':
                    this.prev();
                    break;

                case 'release':
                    // 达到切换阀值，则根据滑动方向切换
                    if (Math.abs(gesture.deltaX) > this.viewport.width * this.proportion) {
                        gesture.direction === 'right' ? this.prev() : this.next();
                    }
                    // 未达到, 则回弹
                    else {
                        this.go(this.index);
                    }
                    break;
            }
        },

        /**
         * 开启全屏模式(即 隐藏/显示 工具条和信息条)
         */
        full: function () {
            $(this.main).toggleClass('ui-imageview-full');
        },

        /**
         * 渲染工具条tpl
         *
         * @return {string}
         */
        renderToolBar: function () {
            var div = document.createElement('div');

            div.innerHTML = [
                '<div class="imageview-toolbar">',
                    '<span data-role="back"></span>',
                    '<p><span data-role="curPic"></span>/',
                    '<span data-role="totalPic">' + this.len + '</span>张图片</p>',
                '</div>'
                ].join('');

            return div.firstChild;
        },

        /**
         * 自定义bar
         */
        renderMetaBar: function () {
        },

        /**
         * 图片源变更时触发更新
         * @param {HTMLElement} container 有数据源的元素
         */
        update: function (container) {
            if (container !== this.elem) {
                this.elem = container;
                this.repaint();
            }
        },

        /**
         * 从新的图片源处获取数据并重绘
         */
        repaint: function () {
            this.imgSource = this.reloadImageSource();

            this.len = this.imgSource.length;

            $(this.toolbar).show().find('[data-role="totalPic"]').html(this.len);

            $(this.metabar).show();

            this.append();

            this.initPos();
        },

        /**
         * 重绘图片源的HTML结构
         */
        append: function () {
            var self = this;

            this.wrapper.innerHTML = '';

            this.imgSource.forEach(function (image, index) {
                var li = document.createElement('li');
                li.setAttribute('class', 'imageview-item');
                li.setAttribute('data-load', 0);

                var img = document.createElement('img');
                img.src = 'placeholder.png';

                li.appendChild(img);
                self.wrapper.appendChild(li);
            });
        },

        /**
         * 打开图片预览器
         *
         * @return {Object}
         */
        show: function () {
            var self = this;

            $(this.mask).show();

            function popstateEvent() {
                e.preventDefault();

                self.hide(e);

                window.removeEventListener('popstate', popstateEvent);
            }

            history.pushState({}, '查看相册');

            window.addEventListener('popstate', popstateEvent);

            return this;
        },

        /**
         * 关闭图片预览器
         */
        hide: function (e) {
            if (e && e.type == 'popstate') {
                $(this.mask).hide();
            }
            else {
                history.back();
            }
        },

        /**
         * 前一页
         */
        prev: function () {
            this.go(this.index - 1);
        },

        /**
         * 后一页
         */
        next: function () {
            this.go(this.index + 1);
        },

        /**
         * 查看某一页
         *
         * @param {number} index 索引值
         */
        go: function (index) {
            // 修正index, 回弹不触发
            if (index !== this.index) {
                this.index = index = Math.max(0, Math.min(index, this.len - 1));
                $(this.toolbar).trigger('pagechange', index);
            }

            this.move(-index / this.len * 100, this.speed);

            this.loadImage(index);

            for (var i = 1, len = this.preload || 0; i <= len; i++) {
                this.loadImage(index + i);
                this.loadImage(index - i);
            }
        },

        /**
         * 图片切换的动画效果
         *
         * @param {number}  dist 滑动的距离
         * @param {number}  speed 切换的速度, ms
         */
        move: function (dist, speed) {
            var cssText = {
                '-webkit-transform': 'translate3d(' + dist + '%, 0, 0) scale3d(1, 1, 1)',
                'transform': 'translate3d(' + dist + '%, 0, 0) scale3d(1, 1, 1)'
            };

            this.animate && $.extend(
                cssText,
                {
                    '-webkit-transition': '-webkit-transform ' + (speed || 0) + 'ms',
                    'transition': 'transform ' + (speed || 0) + 'ms'
                }
            );

            $(this.wrapper).css(cssText);
        }
    };

    /**============= Utils ================**/

    /**
     * 缩放图片居中显示
     *
     * @param {HTMLElement} img 图片源
     * @param {Object} size 缩放到的尺寸 {width:,height:}
     * @param {number=} scale 用于美化的缩放比例
     */
    function imageResizeToCenter(img, size, scale) {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var sw = size.width;
        var sh = size.height;

        // 不传则不缩放
        scale = scale || 1;

        // 先以宽为基准缩放
        if (w > sw) {
            h *= sw / w;
            w = sw;
        }

        // 再以高为基准缩放
        if (h > sh) {
            w *= sh / h;
            h = sh;
        }

        // 考虑美观，再稍微缩放一点，让图片四周多点间距
        w *= scale;
        h *= scale;

        img.style.width = w + 'px';
        img.style.height = h + 'px';

        // 高度不足, 需垂直居中（水平居中CSS已处理了）
        if (h < sh) {
            img.style['margin-top'] = Math.round(Math.max((sh - h) / 2, 0)) + 'px';
        }
    }

    /**
     * 复制source属性到target，覆盖target同名属性
     *
     * @param {Object} target 目标对象
     * @param {Object=} source 源对象
     */
    function extend(target, source) {
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
    }

    module.exports = ImageView;

});
