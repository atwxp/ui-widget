define(function (require, exports, module) {

    var util = require('./util');

    /**
     * detect elem wheather in viewport
     *
     * @param {DOM} elem, element to be detect
     * @param {DOM} wrapper, window or wrapper
     * @param {number} threshold, detect threshold
     * @param {boolean} isHorizontal, detect direction: vertical/horizontal
     * @return {boolean} is in viewport
     */
    var isInViewport = function (elem, viewport, threshold, isHorizontal) {
        var viewTop = viewport.top;
        var viewBottom = viewport.bottom;

        var offset = elem.getBoundingClientRect();
        var elemTop = offset[isHorizontal ? 'left' : 'top'] - threshold;
        var elemBottom = elemTop + offset[isHorizontal ? 'width' : 'height'] + 2 * threshold;

        return (elemTop > viewTop && elemTop < viewBottom)
            || (elemBottom >= viewTop && elemBottom <= viewBottom)
            || (elemTop <= viewTop && elemBottom >= viewBottom);
    };

    /**
     * detect elem is visible, simply 'none' || 'hidden'
     *
     * @param {DOM} elem, image element
     * @return {boolean} is visible
     */
    var isVisible = function (elem) {

        var styles = window.getComputedStyle(elem, null);

        return !(styles.display === 'none' || styles.visibility === 'hidden' || parseFloat(styles.opacity) === 0);
    };

    /**
     * load image
     *
     * @param {DOM} elem, image element to be load
     * @param {Function} callback, loaded callback
     * @param {String} dataSrcAttr, attribute name of image src
     * @param {Object} elemCount, elementCount.num: number of elements
     */
    var loadImage = function (elem, dataSrcAttr, loadStatus, callback) {
        var src = elem.getAttribute(dataSrcAttr);

        // 某个区块elem出现在可视区域时才执行某种动作
        if (elem.hasAttribute('data-arealazy')) {
            loadStatus.total++;

            elem.lazyload = 'load';

            elem.classList.add(src);

            callback && callback(null, elem, src);

            return;
        }

        var isImageNode = elem.nodeName.toLowerCase() === 'img';

        var img = isImageNode ? elem : new Image();

        elem.lazyload = 'loading';

        img.addEventListener('load', function () {
            if (!isImageNode) {
                elem.style['background-image'] = 'url(' + src + ')';
            }

            elem.lazyload = 'load';

            loadStatus.total++;

            callback && callback(null, elem, src, img);
        }, false);

        img.addEventListener('error', function () {
            elem.lazyload = null;

            callback && callback('error', elem, src, img);
        }, false);

        img.setAttribute('src', src);
    };

    var getViewport = function (container, isHorizontal) {
        var viewSize = {};

        if (container) {
            var woffset = container.getBoundingClientRect();

            viewSize.top = woffset[isHorizontal ? 'left' : 'top'];
            viewSize.bottom = viewSize.top + (woffset[isHorizontal ? 'width' : 'height']);
        }
        else {
            viewSize.top = 0;
            viewSize.bottom = window[isHorizontal ? 'innerWidth' : 'innerHeight'];
        }

        return viewSize;
    };

    /**
     * init lazyload
     *
     * @param {string}  selector,             selector for img
     * @param {Object}  options,              options for lazyload
     * @param {Function} callback,            loaded callback
     * @param {DOM}     options.container,    layload's container
     * @param {string}  options.dataSrcAttr,  img url placeholder name
     * @param {boolean} options.isHorizontal, scroll direction vertical(default)/horizontal
     * @param {number}  options.threshold,    threshold for detect isInViewport
     * @param {boolean} options.isAsync,      wheather async query img
     * @param {boolean} options.skipInvisible,wheather skip invisible img
     * @param {boolean} options.keepListen,   wheather keep listen callback
     * @param {boolean} options.isContainer,
     * @param {boolean} options.isContainerHorizontal,
     */
    var init = function (selector, options, callback) {
        var container = options.container || document.body;
        var dataSrcAttr = options.dataSrcAttr || 'data-src';
        var isHorizontal = options.isHorizontal || false;
        var threshold = options.threshold || 0;
        var isAsync = options.isAsync || false;
        var skipInvisible = options.skipInvisible || false;
        var type = options.type;

        var viewContainer = options.viewContainer;
        var isContainer = options.isContainer || false;
        var isContainerHorizontal = options.isContainerHorizontal || false;

        if (viewContainer === undefined) {
            viewContainer = container;
        }

        var dispose;
        var loadStatus = {total: 0};
        var viewSize = getViewport(null, isHorizontal);
        var containerSize = isContainer ? getViewport(viewContainer, isContainerHorizontal) : {};

        if (!isAsync) {
            var elements = container.querySelectorAll(selector);
        }

        var detect = function (e) {
            var eventType = e && e.type;

            if (isAsync) {
                elements = container.querySelectorAll(selector);
            }

            // 同步状态是否所有图片都加载完成
            if (!isAsync && loadStatus.total === elements.length) {
                dispose();
            }
            // 适口发生变化才重新计算适口大小
            // todo：如何获取正确的视口大小
            // 在ajax获取页面结果或者有其他lazy图片导致页面高度发生变化视口高度获取不准确
            // if (eventType === 'resize' || eventType === 'orientationchange') {
                viewSize = getViewport(null, isHorizontal);
                containerSize = isContainer ? getViewport(viewContainer, isContainerHorizontal) : {};
            // }

            for (var i = 0, len = elements.length; i < len; i++) {
                var elem = elements[i];

                if (
                    !elem.lazyload
                    && elem.hasAttribute(dataSrcAttr)
                    && (!skipInvisible || isVisible(elem))
                    && isInViewport(elem, viewSize, threshold, isHorizontal)
                    && (isContainer ? isInViewport(elem, containerSize, threshold, isContainerHorizontal) : true)
                ) {
                    loadImage(elem, dataSrcAttr, loadStatus, callback);
                }
            }
        };

        // bind event
        var detectTh = util.debounce(50, detect);
        dispose = function () {
            document.removeEventListener('DOMContentLoaded', detect);
            window.removeEventListener('resize', detectTh);
            window.removeEventListener('orientationchange', detect);
            window.removeEventListener('scroll', detectTh);
            if (type === 'touchmove') {
                container.removeEventListener(type, detectTh);
            }
        };
        document.addEventListener('DOMContentLoaded', detect, false);
        window.addEventListener('resize', detectTh, false);
        window.addEventListener('orientationchange', detect, false);
        window.addEventListener('scroll', detectTh, false);
        if (type === 'touchmove') {
            container.addEventListener(type, detectTh, false);
        }

        // start lazyload
        detect();
    };

    module.exports = {
        init: init
    };

});
