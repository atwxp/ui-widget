;
(function() {
  /**
   * 按照 size 尺寸缩放 img, 得到的尺寸应用在 canvas 中
   * 因为还要在img上定位文案, 所以需要嵌套一个容器, img本身在css中使用100%继承宽高
   *
   * @param {DOM}    canvas      image's container
   * @param {DOM}    img         image to be scaled
   * @param {Object} size        reference size
   * @param {number} size.width  reference size's width
   * @param {number} size.height reference size's height
   *
   * @return {Object}
   */
  var resizeImage = function(canvas, img, size) {
    var w = img.naturalWidth || img.width;
    var h = img.naturalHeight || img.height;

    var imgW = w;
    var imgH = h;

    var sw = size.width;
    var sh = size.height;

    if (sw / sh > w / h) {
      w *= sh / h;
      h = sh;
    } else {
      h *= sw / w;
      w = sw;
    }

    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    if (h < sh) {
      canvas.style['margin-top'] = Math.round((sh - h) / 2) + 'px';
    }

    return {
      imgW: imgW,
      imgH: imgH,
      sw: sw,
      sh: sh,
      w: w,
      h: h
    };
  };

  /**
   * load image
   *
   * @param {DOM}      canvas   image's container
   * @param {DOM}      img      image to be load
   * @param {string}   imgUrl   image's url
   * @param {Object}   size     reference size
   * @param {number} size.width  reference size's width
   * @param {number} size.height reference size's height
   * @param {function} callback load callback
   */
  var loadImage = function(canvas, img, imgUrl, size, callback) {
    img.style.visibility = 'hidden';

    img.addEventListener('load', function() {
      img.style.visibility = 'visible';

      var data = resizeImage(canvas, img, size);

      callback && callback(data);
    }, false);

    img.addEventListener('error', function() {

    });

    img.setAttribute('src', imgUrl);
  };

  /**
   * 根据 size 计算新的坐标
   *
   * @param {Object.Array}  coords
   */
  var adjustCoords = function(coords, size) {
    for (var i = 0, len = coords.length; i < len; i++) {
      var cds = coords[i];
      var lct = cds.location;

      lct.x = lct.x / size.imgW * size.w;
      lct.y = lct.y / size.imgH * size.h;
    }

    return coords;
  };

  var doDraw = function(x, y, text, direction) {
    var span = document.createElement('span');

    span.setAttribute('class', 'face-booth-label');

    if (direction) {
      span.className += ' face-booth-label-' + direction + ' ';
    }

    span.textContent = text;

    span.style.left = x + 'px';
    span.style.top = y + 'px';

    return span;
  };

  var isOverLap = function(rect1, rect2) {
    var xd = Math.abs(rect1.midx - rect2.midx);
    var yd = Math.abs(rect1.midy - rect2.midy);
    var ah = (rect1.h + rect2.h) / 2;
    var aw = (rect1.w + rect2.w) / 2;

    if (xd <= aw && yd <= ah) {
      return true;
    }
  };

  var checkDirection = function(rect, markers) {
    for (var i = 0, l = markers.length; i < l; i++) {
      var mk = markers[i];

      if (isOverLap(mk, rect)) {
        return false;
      }
    }

    return true;
  };

  var isOverBoundary = function(rect, size) {
    return rect.midx - rect.w / 2 <= (size.w - size.sw) / 2 ||
      rect.midx + rect.w / 2 >= (size.sw + size.w) / 2 ||
      rect.midy - rect.h / 2 <= (size.h - size.sh) / 2 ||
      rect.midy + rect.h / 2 >= (size.sh + size.h) / 2;
  };

  var drawTip = function(container, coords, size) {
    var fragment = document.createDocumentFragment();

    var direction = ['right', 'left', 'bottom', 'top'];

    var markers = [];
    for (var k = 0, length = coords.length; k < length; k++) {
      var coord = coords[k];

      markers[k] = {
        midx: coord.location.x,
        midy: coord.location.y,
        w: 6,
        h: 6
      };
    }

    for (var i = 0, len = coords.length; i < len; i++) {
      var cds = coords[i];

      var x = cds.location.x;
      var y = cds.location.y;
      var text = cds.text;

      var rect = null;
      var dir = '';

      // 有文案
      if (text) {
        // 检查能放在哪一边 (left, right, bottom, top)
        for (var j = 0, l = direction.length; j < l; j++) {
          if (direction[j] === 'right') {
            rect = {
              midx: x + 49,
              midy: y,
              w: 73,
              h: 26
            };
          }
          // 73 是label矩形宽(60) + 三角宽度(13)
          // 26是label矩形高度
          // 49 是 矩形宽度/2(60/2) + 三角宽度(13) + 三角和圆点间隔(3) + 圆点半径(3)
          if (direction[j] === 'left') {
            rect = {
              midx: x - 49,
              midy: y,
              w: 73,
              h: 26
            };
          }
          if (direction[j] === 'bottom') {
            rect = {
              midx: x,
              midy: y + 24,
              w: 60,
              h: 31
            };
          }
          // 60 是label矩形宽
          // 31是label矩形高度(26)＋三角高度(5)
          // 24 是 矩形高度/2(26/2) + 三角宽度(5) + 三角和圆点间隔(3) + 圆点半径(3)
          if (direction[j] === 'top') {
            rect = {
              midx: x,
              midy: y - 24,
              w: 60,
              h: 31
            };
          }

          if (checkDirection(rect, markers) && !isOverBoundary(rect, size)) {
            dir = direction[j];

            break;
          }
        }

        if (dir) {
          var node = doDraw(x, y, text, dir);

          node && fragment.appendChild(node);

          markers.push(rect);
        }
      }
    }

    container.appendChild(fragment);
  };

  var parseCoords = function(rawCoords) {
    var coords = [];

    try {
      rawCoords = JSON.parse(rawCoords);
    } catch (e) {
      rawCoords = [];
    }

    for (var i = 0, len = rawCoords.length; i < len; i++) {
      var coord = rawCoords[i];
      var lct = coord.locations;

      var rand = parseInt(Math.random() * 1000, 10) % (lct.length || 1);

      coords.push({
        text: coord.text,
        location: lct.length ? lct[rand] : lct
      });
    }

    return coords;
  };

  var init = function() {
    var wrapper = document.querySelector('.face-booth');

    var canvas = wrapper && wrapper.querySelector('.face-booth-draw');

    var img = canvas && canvas.querySelector('img');

    var imgUrl = img && img.getAttribute('data-src');

    var rawCoords = parseCoords('[{"text":"有钱任性","locations":[{"x":"205.347","y":"71.2227"},{"x":"185.888","y":"71.2227"}]},{"text":"颜值逆天","locations":[{"x":"367.887","y":"104.65"},{"x":"358.565","y":"104.65"}]},{"text":"","locations":[{"x":"317.151","y":"71.3603"},{"x":"306.389","y":"71.3603"}]},{"text":"","locations":[{"x":"103.291","y":"79.7772"},{"x":"92.2953","y":"79.7772"}]},{"text":"","locations":[{"x":"240.837","y":"84.7752"},{"x":"229.025","y":"84.7752"}]}]');

    if (!imgUrl || !rawCoords.length) {
      return;
    }

    var wrapperSize = {
      width: wrapper.clientWidth,
      height: wrapper.clientHeight
    };

    loadImage(canvas, img, imgUrl, wrapperSize, function(size) {
      var coords = adjustCoords(rawCoords, size);

      drawTip(canvas, coords, size);
    });
  };

  document.addEventListener('DOMContentLoaded', init, false);
})();
