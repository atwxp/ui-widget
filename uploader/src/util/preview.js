define(function (require, exports, module) {

    /**
     * image preview
     *
     * @param {Object}   options             配置项
     * @param {Array}    options.imgSource   图片集合
     * @param {number=}  options.zoomScale   使图片好看的附加缩放比例
     */
    function ImageView(options) {
        var defaults = {
            imgSource: [],
            zoomScale: 1
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

            // 生成模板
            this.initTpl();

            this.initPos();

            this.bindEvent();
        },

        /**
         * 初始化模板
         */
        initTpl: function () {
            // 遮罩层
            var maskDiv = this.mask = document.createElement('div');
            maskDiv.setAttribute('class', 'ui-mask');

            var wrapDiv = this.wrap = document.createElement('div');
            wrapDiv.setAttribute('class', 'ui-imageview');
            maskDiv.appendChild(wrapDiv);

            var close = this.close = document.createElement('span');
            close.setAttribute('data-role', 'close-btn');
            close.setAttribute('class', 'close');
            maskDiv.appendChild(close);

            document.body.appendChild(maskDiv);

            this.append();
        },

        append: function () {
            this.wrap.innerHTML = '';

            var img = this.img = document.createElement('img');

            img.setAttribute('data-load', 0);

            img.setAttribute('data-cid', ImageView.cid++);

            this.wrap.appendChild(img);
        },

        bindEvent: function () {
            var me = this;

            this.mask.querySelector('[data-role="close-btn"]').addEventListener('click', function () {
                me.hide();
            }, false);
        },

        refresh: function (src, orientation) {
            this.append();

            var img = this.img;

            var me = this;

            img.onload = function () {
                this.onload = null;

                this.setAttribute('data-load', 1);

                imageResizeToCenter(img, me.viewport, me.zoomScale, orientation);

                me.show();
            };

            img.src = src;

        },

        /**
         * 初始化时调整图片大小适应屏幕
         */
        initPos: function () {
            var viewW = window.innerWidth;
            var viewH = window.innerHeight;

            this.viewport = {
                width: viewW,
                height: viewH
            };
        },

        /**
         * 打开图片预览器
         *
         * @return {Object}
         */
        show: function () {
            var self = this;

            this.mask.style.display = 'block';

            return this;
        },

        /**
         * 关闭图片预览器
         */
        hide: function (e) {
            this.mask.style.display = 'none';
        }
    };

    /**
     * 缩放图片居中显示
     *
     * @param {HTMLElement} img     图片源
     * @param {Object} size         缩放到的尺寸 {width:,height:}
     * @param {number=} scale       用于美化的缩放比例
     * @param {number=} orientation 图片翻转信息
     */
    function imageResizeToCenter(img, size, scale, orientation) {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var sw = size.width;
        var sh = size.height;

        if (orientation && ('5678'.indexOf(orientation) > -1)) {
            w = img.naturalHeight || img.height;
            h = img.naturalWidth || img.width;
        }

        // 不传则不缩放
        scale = scale || 1;

        if (w > sw) {
            h *= sw / w;
            w = sw;
        }

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
