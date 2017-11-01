/**
 * @file picture compress && upload && watermark
 * @author wxp201013@gmail.com
 */

define(function (require, exports, module) {
    var Emitter = require('util/emitter.js');
    var Exif = require('util/exif.js');
    var util = require('util/util.js');
    var ImageView = require('util/preview.js');

    var Instagram = {

        /**
         * options.cid       the num of upload img
         * options.max       the max num of upload img
         * options.referNode
         * options.wrapper   the preview's container
         * options.quality   compress quality by canvas
         * options.previewH      preview height
         * options.previewW      preview width
         * options.isThumb      preview width
         * options.watermarkW      preview width
         * options.watermarkH      preview width
         * options.watermarkText      preview width
         */
        options: {
            cid: 0,
            max: 9999,
            referNode: null,
            wrapper: null,
            quality: 1,
            previewH: 0,
            previewW: 0,
            isThumb: false,
            watermarkText: '@百度糯米',
            watermaskPosition: ''
        },

        init: function (options) {

            util.extend(this.options, options);

            this.initCanvas();

            return this;
        },

        /**
         * init canvas
         */
        initCanvas: function () {
            try {
                var canvas = document.createElement('canvas');
        
                var ctx = canvas.getContext('2d');

                this.canvas = canvas;

                this.ctx = ctx;
            }
            catch (e) {
                throw new Error('浏览器不支持canvas');
            }
        },

        /**
         * select picture from local file system callled when input[file] change
         *
         * @param {Object} files Files List
         */
        select: function (files) {
            var len = files.length;

            // no select file
            if (!len) {
                return;
            }

            var options = this.options;

            var cid = options.cid;
            var max = options.max;

            var referNode = options.referNode;
            var wrapper = options.wrapper;

            // remaing pictures that allowed to upload
            var remaing;

            if (cid >= max) {
                alert('一次最多上传' + max + '张图片');
                return;
            }

            if (len + cid > max) {
                remaing = max - cid;
            }

            for (var i = 0; i < len; i++) {

                if (remaing && i === remaing) {

                    alert('一次最多上传' + max + '张图片');

                    break;
                }

                this.createImgTpl();

                if (referNode) {
                    wrapper.insertBefore(this.uploadListNode, referNode);
                }
                else {
                    wrapper.appendChild(this.uploadListNode);
                }
                wrapper.classList.add('active');

                this.readAsDataURL(files[i]);
            }
        },

        /**
         * create preview img template
         */
        createImgTpl: function () {

            var me = this;

            var options = this.options;
            var cid = options.cid++;
            var previewW = options.previewW;
            var previewH = options.previewH;
            var wrapper = options.wrapper;

            var temp = document.createElement('div');

            var tpl = ''
                + '<div class="uploadList uploadList_' + cid + ' loading" data-role="uploadList">'
                +     '<img width="' + previewW + '" height="' + previewH + '" />'
                +     '<div class="loading-icon"><span>重新上传</span></div>'
                +     '<span class="del-icon" data-role="del-icon" data-cid="' + cid + '"></span>'
                + '</div>';

            temp.innerHTML = tpl;

            util.addEvent(util.$('[data-role="del-icon"]', temp), 'click', function (e) {
                e.stopPropagation();

                wrapper.removeChild(this.parentNode);

                me.options.cid--;

                me.fire('picChange', this.getAttribute('data-cid'));
            });

            util.addEvent(util.$('[data-role="uploadList"]', temp), 'click', function () {

                if (this.classList.contains('loading')) {
                    return;
                }

                if (this.classList.contains('error')) {

                    alert('重新上传！');

                    return;
                }

                me.doPreview(this);
            });

            this.imgNode = util.$('img', temp);

            this.uploadListNode = temp.firstChild;
        },

        readAsDataURL: function (file) {
            var reader = new FileReader();

            var me = this;

            reader.onloadend = function (e) {
                me.loadImg(e.target.result, file);
            };

            reader.readAsDataURL(file);
        },

        readAsBlob: function (file) {
            this.url = window.URL || window.webkitURL;

            this.loadImg(this.url.createObjectURL(file), file);
        },

        /**
         * get image orientation
         *
         * @param {Object}   file      the image binary file
         * @param {Function} callback  the callback
         */
        getOrientation: function (file, callback) {
            var me = this;

            Exif.getData(file, function () {
                me.orientation = Exif.getTag(this, 'Orientation') || 0;

                callback && callback(me.orientation);
            });
        },
        /**
         * load image
         * 1. load preview image (resize && fix orientation)
         * 2. load origin image (fix orientation)
         *
         * @param {string} src     origin image source, eg: base64/url
         * @param {Object} file    origin image binary file
         */
        loadImg: function (src, file) {

            var imgNode = this.imgNode;
            var uploadListNode = this.uploadListNode;
            var isThumb = this.options.isThumb;

            var me = this;

            imgNode.onerror = function () {
                console.log('image error');

                uploadListNode.classList.remove('loading');

                uploadListNode.classList.add('error');
            };

            imgNode.onload = function () {
                // fire upload to server
                me.fire('picPost', this.src);
                // me.fire('picPost', this.base64ToBlob(this.src));

                uploadListNode.classList.remove('loading', 'error');

                // release memory
                me.uploadListNode = null;

                me.imgNode = null;

                if (me.url) {

                    me.url.revokeObjectURL(this);

                    me.url = null;
                }
            };

            var img = new Image();

            // until now, we can get img.width/height/orientation,
            // then we can fix image orientation, finaly return img base64
            img.onload = function () {
                util.$('.ret').innerHTML += '<br/>图片原始尺寸' + img.width + ' x ' + img.height;

                me.getOrientation(file, function (orientation) {
                    // test
                    util.$('.ret').innerHTML += '<br />orientation: ' + orientation;

                    var source = me[isThumb ? 'createThumb' : 'createOrigin'](img, orientation);

                    imgNode.src = source;

                    imgNode.setAttribute('data-orientation', orientation);
                });
            };

            img.src = src;

            // test
            util.$('.ret').innerHTML = ''
                + '<br />原始文件大小：' + this.getImgSize(file) + 'M'
                + '<br />MIME：' + file.type;
        },

        getImgSize: function (file) {
            return Math.round(file.size / 1024 / 1024 * 100) / 100;
        },

        canvas2img: function (img, orientation, resize) {
            var t = +new Date();

            var options = this.options;
            var canvas = this.canvas;
            var ctx = this.ctx;

            var w = resize && resize.width || img.naturalWidth || img.width;
            var h = resize && resize.height || img.naturalHeight || img.height;
            
            // 在这里设置 orientation = null 可以在安卓上看到图片翻转的效果
            orientation = null;

            if (orientation && ('5678'.indexOf(orientation) > -1)) {
                var w = resize && resize.height || img.naturalWidth || img.width;
                var h = resize && resize.width || img.naturalHeight || img.height;
            }

            canvas.width = w;
            canvas.height = h;
            ctx.clearRect(0, 0, w, h);

            ctx.save();

            switch (orientation) {
                case 3:
                    ctx.rotate(180 * Math.PI / 180);
                    ctx.drawImage(img, -w, -h, w, h);
                    break;
                case 6:
                    ctx.rotate(90 * Math.PI / 180);
                    ctx.drawImage(img, 0, -w, h, w);
                    break;
                case 8:
                    ctx.rotate(270 * Math.PI / 180);
                    ctx.drawImage(img, -h, 0, h, w);
                    break;

                case 2:
                    ctx.translate(w, 0);
                    ctx.scale(-1, 1);
                    ctx.drawImage(img, 0, 0, w, h);
                    break;
                case 4:
                    ctx.translate(w, 0);
                    ctx.scale(-1, 1);
                    ctx.rotate(180 * Math.PI / 180);
                    ctx.drawImage(img, -w, -h, w, h);
                    break;
                case 5:
                    ctx.translate(w, 0);
                    ctx.scale(-1, 1);
                    ctx.rotate(90 * Math.PI / 180);
                    ctx.drawImage(img, 0, -w, h, w);
                    break;
                case 7:
                    ctx.translate(w, 0);
                    ctx.scale(-1, 1);
                    ctx.rotate(270 * Math.PI / 180);
                    ctx.drawImage(img, -h, 0, h, w);
                    break;

                default:
                    ctx.drawImage(img, 0, 0, w, h);
            }

            ctx.restore();

            // add watermark
            // ctx.drawImage(this.watermark({
            //     width: w,
            //     height: h,
            //     text: options.watermarkText,
            //     position: options.watermaskPosition
            // }), 0, 0);

            var source = canvas.toDataURL('image/jpeg', this.options.quality);

            // test
            util.$('.ret').innerHTML += '<br />time: ' + (+new Date() - t) + 'ms';
            util.$('.ret').innerHTML += '<br />canvas: ' + this.getImgSize(this.base64ToBlob(source)) + 'M';

            return source;
        },

        createOrigin: function (img, orientation) {
            var resize = this.getResize(img, orientation, {
                width: window.innerWidth * window.devicePixelRatio,
                height: window.innerHeight * window.devicePixelRatio
            });

            // 相对视口压缩
            return this.canvas2img(img, orientation, resize);

            // 对图片本身压缩
            // return this.canvas2img(img, orientation);
        },

        createThumb: function (img, orientation) {
            var resize = this.getResize(img, orientation);

            return this.canvas2img(img, orientation, resize);
        },

        /**
         * resize picture
         */
        getResize: function (img, orientation, resize) {

            var devicePixelRatio = window.devicePixelRatio;

            var width = resize && resize.width || this.options.previewW * devicePixelRatio;
            var height = resize && resize.height || this.options.previewH * devicePixelRatio;

            var ret = {
                width : img.naturalWidth || img.width,
                height: img.naturalHeight || img.height
            };
            if (orientation && ('5678'.indexOf(orientation) > -1)) {
                ret.width  = img.naturalHeight || img.height;
                ret.height = img.naturalWidth || img.width;
            }

            var scale = ret.width / ret.height;
            if (width && height) {
                if (scale >= width / height) {
                    if (ret.width > width) {
                        ret.width  = width;
                        ret.height = Math.ceil(width / scale);
                    }
                }
                else {
                    if (ret.height > height) {
                        ret.height = height;
                        ret.width  = Math.ceil(height * scale);
                    }
                }
            }
            else if (width) {
                if (width < ret.width) {
                    ret.width  = width;
                    ret.height = Math.ceil(width / scale);
                }
            }
            else if (height) {
                if (height < ret.height) {
                    ret.width  = Math.ceil(height * scale);
                    ret.height = height;
                }
            }
            // 超过这个值base64无法生成，在IOS上
            while (ret.width >= 3264 || ret.height >= 2448) {
                ret.width *= 0.8;
                ret.height *= 0.8;
            }

            return ret;
        },

        /**
         * image preview
         */
        doPreview: function (uploadList) {
            if (!this.imageview) {
                this.imageview = new ImageView();
            }

            var img = uploadList.querySelector('img');

            this.imageview.refresh(img.src, img.getAttribute('data-orientation'));
        },

        /**
         * make watermark
         * 
         * @params {Object} options
         * @params {Object} options.width
         * @params {Object} options.height
         * @params {Object} options.text
         * @params {Object} options.position
         *
         * @return {Object} canvas
         */
        watermark: function (options) {

            options = options || {};
            var width = options.width;
            var height = options.height;
            var text = options.text || '';

            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            ctx.clearRect(0, 0, width, height);

            ctx.lineWidth = 2;
            ctx.fillStyle = '#fff';
            ctx.font = parseInt(Math.max(12, width / 1200 * 40), 10) + 'px Arial';

            // http://tutorials.jenkov.com/html5-canvas/text.html
            // http://www.homeandlearn.co.uk/JS/html5_canvas_text_alignment.html
            switch (options.position) {
                case 'left-top':
                    ctx.textBaseline = 'top';
                    ctx.fillText(text, 10, 10);
                    break;
                case 'left-bottom':
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(text, 10, height - 10);
                    break;
                case 'right-top':
                    ctx.textBaseline = 'top';
                    ctx.fillText(text, width - ctx.measureText(text).width - 10, 10);
                    break;
                default:
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(text, width - ctx.measureText(text).width - 10, height - 10);
                    break;
            }

            return canvas;
        },

        base64ToBlob: function (base64Str) {
            var strArr = base64Str.split(',');
            var type = strArr[0].split(':')[1].split(';')[0];

            if (strArr[0].indexOf('base64') >= 0) {
                var code = window.atob(strArr[1]);
            }
            else {
                code = unescape(strArr[1]);
            }
            var uinit = new Uint8Array(code.length);

            for (var i = 0; i < code.length; i++) {
                uinit[i] = code.charCodeAt(i);
            }

            try {
                var ret = new Blob([uinit], {type: type});
            }
            catch (e) {
                window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder
                    || window.MozBlobBuilder || window.MSBlobBuilder

                if ('TypeError' == e.name && window.BlobBuilder) {
                    var builder = new BlobBuilder;

                    builder.append(uinit.buffer);

                    var ret = builder.getBlob(type);
                }
                else {
                    'InvalidStateError' === e.name && (ret = new Blob([uinit.buffer], {type: type}));
                }
            }

            return ret;
        }
    };

    Emitter.mixTo(Instagram);

    module.exports = function (options) {
        return Object.create(Instagram).init(options);
    };

});