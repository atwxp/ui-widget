export function retinaCanvas(canvas, width, height) {
  const context = canvas.getContext('2d');

  const backingStorePixelRatio = context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1;

  const ratio = (window.devicePixelRatio || 1) / backingStorePixelRatio;

  width = width || canvas.width;
  height = height || canvas.height;

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  context.scale(ratio, ratio);

  return canvas;
}

export function throttle(callback, wait) {
  let prev = 0;
  let timer;
  let args;

  var later = function() {
    prev = +new Date();

    callback.apply(this, args);

    timer = null;
  };

  return function(...rest) {
    args = rest;

    const now = +new Date();

    const remain = wait - (now - prev);

    if (remain <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      prev = now;

      callback.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(later.bind(this), remain);
    }
  }
}
