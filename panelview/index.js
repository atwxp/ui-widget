define(function(require, exports, module) {
  var $ = require('zepto');

  var util = require('common/lib/util');
  var Emitter = require('common/lib/emitter');

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

  /**
   * constructor
   *
   * @param {Object}                options,      options for panelview
   * @param {Zepto|DOM|HTMLElement} options.main, nav&panel's container
   * @param {Object}                options.map,  nav panel map
   * @param {number}                options.thresold, thresold
   * @param {number}                options.proportion, the body proportion to be change nav
   */
  function PanelView(options) {
    this.options = {
      main: '',
      map: {},
      thresold: 0,
      proportion: 0.8,
    };

    util.extend(this.options, options);
  }

  Emitter.enable(PanelView.prototype);

  PanelView.prototype.init = function() {
    var options = this.options;

    this.main = $(options.main);

    this.cur = 0;

    this.updatePanelNode();

    this.bindEvent();
  };

  PanelView.prototype.updatePanelNode = function() {
    var main = this.main;

    var options = this.options;
    var map = options.map;

    var panelNodes = [];
    for (var k in map) {
      if (map.hasOwnProperty(k)) {
        var nav = main.find(k);
        var panel = main.find(map[k]);

        if (nav.length && panel.length) {
          panelNodes[panelNodes.length] = {
            nav: nav,
            panel: panel,
            top: panel.offset().top,
            height: panel.height()
          }
        }
      }
    }
    if (!panelNodes.length) {
      return;
    }
    this.panelNodes = this.sortPanel(panelNodes);
  };

  /**
   * 对panel按照offset.top从小到大排序
   *
   * @param {Array} arr panel array
   *
   * @return {Array} sorted panel
   */
  PanelView.prototype.sortPanel = function(arr) {
    var l = arr.length;
    var temp;

    for (var i = 0; i < l - 1; i++) {
      var minIndex = i;

      for (var j = i + 1; j < l; j++) {
        if (arr[j].top < arr[minIndex].top) {
          minIndex = j;
        }
      }

      if (minIndex !== i) {
        temp = arr[minIndex];
        arr[minIndex] = arr[i];
        arr[i] = temp;
      }
    }

    return arr;
  };

  PanelView.prototype.bindEvent = function() {
    var me = this;

    $.each(this.panelNodes, function(index, node) {
      node.nav.on('click', function() {
        me.scrollToPanel(index);
      });
    });

    window.addEventListener('resize', function() {
      me.updatePanelNode();
    }, false);
    window.addEventListener('orientationchange', function() {
      me.updatePanelNode();
    }, false);

    this.scrollBack = util.debounce(50, this.scrollBack.bind(this));
    window.addEventListener('scroll', this.scrollBack, false);
  };

  /**
   * scroll发生的处理逻辑
   */
  PanelView.prototype.scrollBack = function() {
    var options = this.options;
    var proportion = options.proportion;
    var thresold = options.thresold;

    var panelNodes = this.panelNodes;

    var pageY = util.getPageOffset().y;
    var len = panelNodes.length;
    var min = 9999;
    var cur = 0;

    $.each(panelNodes, function(index, node) {
      var panel = panelNodes[index];

      var diff = pageY - panel.top - thresold;

      if (diff >= 0 && diff <= min) {
        min = diff;

        if (diff >= panel.height * proportion) {
          cur = Math.min(index + 1, len - 1);
        } else {
          cur = index;
        }
      }
    });

    this.fire('scroll', [this.cur, cur, pageY, this.isInViewport(pageY)]);

    if (cur !== this.cur) {
      this.cur = cur;
    }
  };

  /**
   * 判断panel是否在视口内
   *
   * @param {number} scrollTop 页面的滚动距离
   * @return {boolean}
   */
  PanelView.prototype.isInViewport = function(scrollTop) {
    var options = this.options;
    var thresold = options.thresold;

    var pn = this.panelNodes;

    var panelStart = pn[0].top + thresold;

    var lastPanel = pn[pn.length - 1];

    var panelEnd = lastPanel.height + lastPanel.top + thresold;

    var winH = window.innerHeight;

    return (panelStart < (scrollTop + winH) && panelEnd > scrollTop);
  };

  PanelView.prototype.scrollToPanel = function(index) {
    if (index == null || !this.panelNodes[index]) {
      return;
    }

    this.cur = index;

    this.fire('change', [index]);

    var thresold = this.options.thresold;

    var top = this.panelNodes[index].top;

    window.scrollTo(0, top + thresold);
  };

  PanelView.prototype.dispose = function() {
    $.each(this.panelNodes, function(index, node) {
      node.nav.off('click');
    });

    window.removeEventListener('scroll', this.scrollBack);
  };

  module.exports = PanelView;
});
