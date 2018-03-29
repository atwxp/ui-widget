/**
 * @file   waterfall 瀑布流固定列数float
 * @author wxp201013@163.com
 */

define(function(require, module, exports) {
  var extend = function(target, source) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }

    return target;
  };

  var getMin = function(arr) {
    var v = Math.min.apply(null, arr);

    return arr.indexOf(v);
  };

  var getMax = function(arr) {
    var v = Math.max.apply(null, arr);

    return arr.indexOf(v);
  };

  var throttle = function(callback, delay) {
    var start;

    return function() {
      var now = +new Date();
      var args = arguments;
      var me = this;
      var timer;

      start = start || now;

      if (now - start < delay) {
        clearTimeout(timer);

        timer = setTimeout(function() {
          callback.apply(me, args);
        }, delay);
      } else {
        callback.apply(this, args);
        start = now;
      }
    };
  };

  function WaterFall(options) {
    options = extend({
      main: null,
      gap: 0,
      pinNum: 0,
      thresold: 0,
      loadUrl: '',
      params: {}
    }, options);

    this.init(options);
  }

  WaterFall.prototype.init = function(options) {
    this.options = options;

    this.main = document.querySelector(options.main);

    if (!this.main || options.pinNum <= 0) {
      return;
    }

    this.page = 0;

    this.createPin();

    this.bindEvent();
  };

  WaterFall.prototype.createPin = function() {
    var options = this.options;

    var gap = options.gap;

    var pinNum = options.pinNum;

    // width + padding
    var mainW = this.main.clientWidth;

    var colWidth = ((mainW - (pinNum - 1) * gap) / pinNum).toFixed(2);

    var pin = this.pin = [];

    var pinH = this.pinH = [];

    var boxIndex = this.boxIndex = [];

    var fragment = document.createDocumentFragment();

    for (var i = 0; i < pinNum; i++) {
      var div = document.createElement('div');

      div.className = 'wf-col';

      var cssText = 'float:left;width:' + colWidth + 'px;';

      if (i !== 0) {
        cssText += 'margin-left:' + gap + 'px;';
      }

      div.style.cssText = cssText;

      fragment.appendChild(div);

      pin.push(div);

      pinH.push(0);

      boxIndex.push(0);
    }

    this.main.appendChild(fragment);
  };

  WaterFall.prototype.bindEvent = function() {
    var viewY = window.innerHeight;

    var thresold = this.options.thresold;

    var doScroll = function() {
      var mainTop = this.main.getBoundingClientRect().top;

      var mainH = this.pinH[getMax(this.pinH)];

      if (
        mainTop + mainH - thresold <= viewY &&
        !this.xhr
      ) {
        this.load();
      }
    };

    window.addEventListener('scroll', throttle(doScroll.bind(this), 100), false);
  };

  WaterFall.prototype.load = function() {
    if (this.xhr) {
      return;
    }

    this.fire('loading');

    var options = this.options;

    var me = this;

    var params = extend({
      page: this.page++
    }, options.params);

    me.xhr = $.ajax({
      type: 'GET',
      url: options.url,
      data: params,
      success: function(res) {
        if (res.errno || !res.data) {
          console.log('err');
          return;
        }

        me.render(res.data);
      },
      error: function() {

      },
      complete: function() {
        me.xhr = null;
      }
    });
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

    var box = bc.box;

    var minIndex = getMin(this.pinH);

    box.setAttribute('data-col', minIndex);
    box.setAttribute('data-coli', this.boxIndex[minIndex]++);
    box.setAttribute('data-index', this.cur);

    this.pin[minIndex].appendChild(box);

    // margin + padding + border + content
    this.pinH[minIndex] += box.clientHeight;

    this.cur++;

    bc.done = true;
  };

  WaterFall.prototype.render = function(data) {
    var me = this;

    this.boxCache = new Array(data.length);

    this.cur = 0;

    for (var i = 0, l = data.length; i < l; i++) {
      (function(idx) {
        me.createBox(data[idx], function(box, loaded) {
          me.boxCache[idx] = {
            box: box,
            done: false,
            loaded: loaded
          };

          me.runTask();
        });
      })(i);
    }
  };

  WaterFall.prototype.createBox = function(data, callback) {
    var box = document.createElement('div');

    var img = document.createElement('img');

    img.addEventListener('load', function() {
      box.appendChild(img);

      callback(box, true);
    }, false);

    img.addEventListener('error', function() {
      callback(box, false);
    }, false);

    img.src = data.url;
  };

  WaterFall.prototype.start = function() {
    this.bindEvent();
  };

  WaterFall.prototype.stop = function() {
    window.removeEventListener('scroll');

    this.xhr && this.xhr.abort();

    this.xhr = null;
  };

  WaterFall.prototype.dispose = function() {
    var pnode = this.main.parentNode;

    if (pnode) {
      pnode.removeChild(this.main);
    }

    window.removeEventListener('scroll');
  };

  module.exports = WaterFall;
});
