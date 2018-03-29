/**
 * @file   waterfall 瀑布流固定列数float
 * @author wxp201013@163.com
 */

define(function(require, exports, module) {
  var $ = require('zepto');

  var Emitter = require('common/lib/emitter');
  var util = require('common/lib/util');

  var getMin = function(arr) {
    var v = Math.min.apply(null, arr);

    return arr.indexOf(v);
  };

  var getMax = function(arr) {
    var v = Math.max.apply(null, arr);

    return arr.indexOf(v);
  };

  function WaterFall(options) {
    options = util.extend({
      main: null,
      loadIcon: null,
      gapH: 0,
      gapV: 10,
      pinNum: 0,
      loadUrl: '',
      params: {},
      render: null,
      dataUrl: 'url',
      hasTotal: false,
      type: ''
    }, options);

    this.init(options);
  }

  Emitter.enable(WaterFall.prototype);

  WaterFall.prototype.init = function(options) {
    this.options = options;

    this.main = $(options.main);

    if (!this.main.length || options.pinNum <= 0) {
      return;
    }

    this.loadIcon = $(options.loadIcon);

    this.page = 0;

    this.totalLen = 0;

    this.createPin();

    this.bindEvent();
  };

  WaterFall.prototype.bindEvent = function() {
    var me = this;

    this.on('update', function(e, status) {
      me.status = status;
    });

    this.on('loading', function() {
      this.loadIcon.removeClass('hidden');
    });

    this.on('loaded', function() {
      this.loadIcon.addClass('hidden');
    });
  };

  WaterFall.prototype.createPin = function() {
    var options = this.options;

    var gapH = options.gapH;

    var pinNum = options.pinNum;

    var mainW = this.main.width();

    var colWidth = this.colWidth = ((mainW - (pinNum - 1) * gapH) / pinNum).toFixed(2);

    var pin = this.pin = [];

    var pinH = this.pinH = [];

    var boxIndex = this.boxIndex = [];

    var fragment = document.createDocumentFragment();

    for (var i = 0; i < pinNum; i++) {
      var div = document.createElement('div');

      div.className = 'wf-col';

      var cssText = 'float:left;width:' + (colWidth / mainW * 100) + '%;';

      if (i !== 0) {
        cssText += 'margin-left:' + (gapH / mainW * 100) + '%;';
      }

      div.style.cssText = cssText;

      fragment.appendChild(div);

      pin.push(div);

      pinH.push(0);

      boxIndex.push(0);
    }

    this.main.append(fragment);
  };

  WaterFall.prototype.doScroll = function(thresold) {
    if (this.boxCache.length !== this.cur) {
      return;
    }

    var viewY = window.innerHeight;

    var mainTop = this.main[0].getBoundingClientRect().top;

    var mainH = this.pinH[getMax(this.pinH)];

    return mainTop + mainH - thresold <= viewY;
  };

  WaterFall.prototype.loadMore = function(params, callback) {
    var options = this.options;

    var me = this;

    params = $.extend({}, options.params, params);

    this.fire('loading');

    $.ajax({
      type: 'GET',
      url: options.loadUrl,
      data: params,
      success: function(res) {
        var data;

        me.loadedLen = 0;

        if (res.status || !res.data || !(data = me.dealData(res.data))) {
          callback('err');
          return;
        }

        var len = data.length;

        me.loadedLen = len;

        me.page++;

        me.totalLen += len;

        me.render(data);

        callback(null);
      },
      error: function(err) {
        callback(err);
      }
    });
  };

  WaterFall.prototype.dealData = function(data) {
    return data.length && data;
  };

  WaterFall.prototype.runTask = function() {
    for (var i = 0, l = this.boxCache.length; i < l; i++) {
      var bc = this.boxCache[i];

      if (bc && !bc.done && this.cur === i) {
        this.runStep(bc);

        if (this.cur === l) {
          this.fire('loaded');
        }
      }
    }
  };

  WaterFall.prototype.runStep = function(bc) {
    if (!bc.loaded) {
      this.cur++;
      return;
    }

    var options = this.options;

    var box = bc.box;

    var minIndex = getMin(this.pinH);

    box.setAttribute('data-col', minIndex);
    box.setAttribute('data-coli', this.boxIndex[minIndex]++);
    box.setAttribute('data-index', this.cur);

    this.pin[minIndex].appendChild(box);

    // 始终以初始化的宽度为基准计算图片高度，即使用户resize也不影响pinH的变化，只对内容只有图片的有效
    // 不使用 clientHeight = margin + padding + border + content 减少reflow
    if (options.type === 'img') {
      this.pinH[minIndex] += this.colWidth * bc.height / bc.width + options.gapV;
    } else {
      this.pinH[minIndex] += box.clientHeight + options.gapV;
    }

    this.cur++;

    bc.done = true;
  };

  WaterFall.prototype.render = function(data) {
    var me = this;

    var len = data.length;

    this.boxCache = new Array(len);

    this.cur = 0;

    for (var i = 0; i < len; i++) {
      (function(idx) {
        me.createBox(data[idx], function(box, img, loaded) {
          me.boxCache[idx] = {
            box: box,
            done: false,
            loaded: loaded,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height
          };

          me.runTask();
        });
      })(i);
    }
  };

  WaterFall.prototype.createBox = function(data, callback) {
    var options = this.options;

    var render = options.render;

    var box = document.createElement('div');

    box.className = 'wf-item';

    box.innerHTML = typeof render === 'string' ? util.format(render, data) : render(data);

    // var img = new Image(); bugs: 在runStep中执行 appendChild() 在获取box.clientHeight在安卓机下获取不到高度，值为0
    var img = box.querySelector('img');

    if (!img) {
      callback(box, img, true);
      return;
    }

    img.addEventListener('load', function() {
      callback(box, img, true);
    }, false);

    img.addEventListener('error', function() {
      callback(box, img, false);
    }, false);

    img.src = data[options.dataUrl];
  };

  WaterFall.prototype.dispose = function() {
    this.main.html('');
  };

  module.exports = WaterFall;

});
