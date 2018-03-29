/**
 * @file   sticky pollyfill
 * @author wxp201013@163.com
 */

define(function(require, exports, module) {
  /**
   * css 特性检测
   *
   * @param {string} style css声明
   *
   * @use
   *      - featureTest('transition')
   *      - featureTest('position', 'sticky')
   *
   * @see https://github.com/phistuck/Modernizr/commit/3fb7217f5f8274e2f11fe6cfeda7cfaf9948a1f5
   * @return {boolean}
   */
  var featureTest = function(property, value, noPrefixes) {
    var prop = property + ':';

    var el = document.createElement('div');

    var mStyle = el.style;

    value = value || '';

    if (!noPrefixes) {
      mStyle.cssText = prop + ['-webkit-', '-moz-', '-ms-', '-o-', ''].join(value + ';' + prop) + value + ';';
    } else {
      mStyle.cssText = prop + value;
    }

    return mStyle[property].indexOf(value) !== -1;
  };

  var getPageOffset = function() {
    var t = document.documentElement || document.body.parentNode;

    if (window.pageYOffset !== undefined) {
      var y = window.pageYOffset;
    } else {
      y = (t && typeof t.scrollTop === 'number' ? t : document.body).scrollTop;
    }

    if (window.pageXOffset !== undefined) {
      var x = window.pageXOffset;
    } else {
      x = (t && typeof t.scrollLeft === 'number' ? t : document.body).scrollLeft;
    }

    return {
      x: x,
      y: y
    };
  };


  function Sticky(options) {
    options = Object.assign({
      elem: '',

      scroll: true,

      stickyCls: 'sticky',

      fixedCls: 'fixed'
    }, options);

    this.init(options);
  }

  Sticky.prototype.init = function(options) {
    this.options = options;

    var elem = options.elem = $(options.elem);

    if (!elem.length) {
      return;
    }

    if (featureTest('position', 'sticky')) {
      this.supportSticky = true;

      elem.addClass(options.stickyCls);

      return elem;
    }

    if (options.scroll) {
      options.elemTop = elem.offset().top;

      // throttle/debounce
      window.addEventListener('scroll', this.doScroll, false);
    }
  };

  Sticky.prototype.doScroll = function() {
    var options = this.options;

    var elem = options.elem;

    var pageY = getPageOffset().y;

    elem[pageY > options.elemTop ? 'addClass' : 'removeClass'](options.fixedCls);

    // EventEmitter
    this.fire('scroll', [pageY > options.elemTop, pageY, options.elemTop]);
  };

  Sticky.prototype.dispose = function() {
    if (this.options.scroll) {
      window.removeEventListener('scroll', this.doScroll);
    }
  };

  module.exports = Sticky;

});
