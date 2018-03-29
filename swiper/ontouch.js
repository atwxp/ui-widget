define(function (require, exports, module) {

  /**
   * ontouch
   *
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

    var threshold = options && options.threshold || 50;
    var restraint = options && options.restraint || 100;
    var allowedTime = options && options.allowedTime || 250;

    touchsurface.addEventListener('touchstart', function (e) {
      var touchobj = e.changedTouches[0];
      startX = touchobj.pageX;
      startY = touchobj.pageY;
      startTime = +new Date();

      ctx.trigger('touchstart', [e]);

    }, false);

    touchsurface.addEventListener('touchmove', function (e) {
      if (e.touches.length > 1 || e.scale && e.scale !== 1) {
        return;
      }

      if (options && options.disableScroll) {
        e.preventDefault();
      }

      var touchobj = e.changedTouches[0];

      distX = touchobj.pageX - startX;
      distY = touchobj.pageY - startY;

      if (Math.abs(distX) > Math.abs(distY)) {
        dir = (distX < 0) ? 'left' : 'right';

        ctx.trigger('move', [e, dir, distX]);
      } else {
        dir = (distY < 0) ? 'up' : 'down';

        ctx.trigger('move', [e, dir, distY]);
      }

    }, false);

    touchsurface.addEventListener('touchend', function (e) {
      var elapsedTime = +new Date() - startTime;

      if (elapsedTime <= allowedTime) {
        if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
          ctx.trigger('swipe' + dir, [e, distX]);
        } else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
          ctx.trigger('swipe' + dir, [e, distY]);
        } else {
          ctx.trigger('release', [e, (dir === 'left' || dir === 'right') ? distX : distY]);
        }
      } else {
        ctx.trigger('release', [e, (dir === 'left' || dir === 'right') ? distX : distY]);
      }

    }, false);
  }

  module.exports = ontouch;

});
