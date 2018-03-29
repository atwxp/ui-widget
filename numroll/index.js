/**
 * @file numrol
 */

const defaultOption = {
  // 当前值
  num: 0,

  // 每个数字的宽度
  width: '',

  // 每个数字的高度
  height: '',

  ratio: '',

  // 滚动速度
  speed: 1000,

  // 图片地址
  imgUrl: '',

  // 占位数字
  holdNum: 0,

  // 占位数量
  holdCount: 0,
};

export default class NumRoll {
  constructor(element, option = {}) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;

    if (!this.element) {
      return;
    }

    this.option = {
      ...defaultOption,
      ...option,
    };

    this.init();
  }

  init() {
    const {
      num = 0,
      width,
      height,
      ratio,

      imgUrl,
      holdNum = 0,
      holdCount,
    } = this.option;

    this.unit = 'px';
    this.ratio = Math.floor(ratio) || 1;
    this.width = width * this.ratio;
    this.height = height * this.ratio;

    this.wrapper = this.renderWrapper();

    const nextNum = this.formatNumber2String(num);

    // 默认是 0000...
    this.num = this.createPlaceholder(holdNum, holdCount || nextNum.length);

    this.loadImg(imgUrl, (imgW, imgH) => {
      this.width = (width || imgW) * this.ratio;
      this.height = (height || imgH) * this.ratio;

      // 先渲染 this.num, 然后跳到 nextNum
      this.render(this.num);

      this.jumpTo(nextNum);
    });
  }

  // 生成默认数字字符串
  createPlaceholder(num = '', count = 0) {
    return new Array(count + 1).join(num);
  }

  loadImg(imgUrl, cb) {
    if (!imgUrl) {
      cb();
    }

    const img = new Image();

    img.onload = function() {
      cb(img.width, img.height);
    };

    img.onerror = function() {};

    img.src = imgUrl;
  }

  // ensure num is string
  // remove prefix 0, eg: 000230 => 230, 0 => 0
  formatNumber2String(num = '') {
    const n = Number('' + num);
    return '' + (isNaN(n) ? '' : n);
  }

  resetPos(placeholder = '') {
    return placeholder.split('').map(item => {
      // -1 不然对不齐
      return -1 * (item * this.height * this.ratio - 1)
    });
  }

  createItem(num) {
    const elem = document.createElement('i');

    elem.classList.add('hp-numroll-item');

    elem.style.cssText = '' +
      'display:inline-block;' +
      'width:' + this.width + this.unit + '; height:100%;' +
      'background-size: 100% auto; background-position: 0 ' + num + this.unit + ';' +
      (this.option.imgUrl ? 'background-image:url(' + this.option.imgUrl + ');' : '');

    return elem;
  }

  renderWrapper() {
    const wrapper = document.createElement('div');

    wrapper.classList.add('hp-numroll');

    wrapper.style.cssText = 'display:block;height:' + this.height + 'px';

    this.element.appendChild(wrapper);

    return wrapper;
  }

  render(placeholder) {
    this.posArr = this.resetPos(placeholder);

    const prevNumRollItems = this.wrapper.querySelectorAll('i');

    // 78 -> 112
    if (placeholder.length > prevNumRollItems.length) {
      const frag = document.createDocumentFragment();

      for (let i = 0; i < placeholder.length - prevNumRollItems.length; i++) {
        frag.appendChild(this.createItem(this.posArr[i]));
      }

      this.wrapper.insertBefore(frag, this.wrapper.firstChild);
    } else if (placeholder.length < prevNumRollItems.length) {
      for (let j = 0; j < prevNumRollItems.length - placeholder.length; j++) {
        this.wrapper.removeChild(prevNumRollItems[j]);
      }
    }

    this.numRollItems = this.wrapper.querySelectorAll('i');
  }

  animateDom(startNum = '', endNum = '') {
    const numRollItems = this.numRollItems;
    const numRollItemsLen = numRollItems.length;

    // 整体数值走向，加向上翻，减向下翻
    const dir = endNum - startNum > 0 ? 'up' : 'down';

    // 右向左
    let delayConut = 0;
    for (let i = numRollItemsLen - 1; i >= 0; i--) {
      let rightNumRoll = numRollItems[i];

      let rightEndNum = endNum[i];
      let rightStartNum = startNum[i - (numRollItemsLen - startNum.length)];

      let delay = numRollItemsLen - i - 1 - delayConut;

      // 67 -> 123
      if (dir === 'up') {
        if (rightEndNum !== rightStartNum) {
          this.posArr[i] -= rightEndNum < rightStartNum
            ? ((10 + parseInt(rightEndNum, 10)) - rightStartNum) * this.height
            : (rightEndNum - rightStartNum) * this.height;
        } else {
          delay = 0;
          delayConut++;
        }
      } else if (dir === 'down') { // 1467 -> 789
        if (rightEndNum !== rightStartNum) {
          this.posArr[i] += rightEndNum > rightStartNum
            ? ((10 + parseInt(rightStartNum, 10)) - rightEndNum) * this.height
            : (rightStartNum - rightEndNum) * this.height;
        } else {
          delay = 0;
          delayConut++;
        }
      }

      rightNumRoll.style.webkitTransition = 'all ' + this.option.speed + 'ms ' + 0.3 * delay + 's';
      rightNumRoll.style.transition = 'all ' + this.option.speed + 'ms ' + 0.3 * delay + 's';

      const transitionEnd = () => {
        if (this.posArr[i] > 0) {
          this.posArr[i] = -1 * (10 * this.height - this.posArr[i]);
        } else {
          this.posArr[i] = -1 * (Math.abs(this.posArr[i]) % (10 * this.height));
        }

        rightNumRoll.removeEventListener('webkitTransitionEnd', transitionEnd);
        rightNumRoll.removeEventListener('transitionEnd', transitionEnd);
        rightNumRoll.style.webkitTransition = 'none';
        rightNumRoll.style.transition = 'none';
        rightNumRoll.style.backgroundPosition = '0 ' + this.posArr[i] + this.unit;
      };

      rightNumRoll.style.backgroundPosition = '0 ' + this.posArr[i] + this.unit;
      rightNumRoll.addEventListener('webkitTransitionEnd', transitionEnd);
      rightNumRoll.addEventListener('transitionEnd', transitionEnd);
    }
  }

  jumpTo(endNum) {
    endNum = this.formatNumber2String(endNum);

    if (!endNum) {
      return;
    }

    let startNum = this.num;

    // 99 -> 100
    if (endNum.length > startNum.length) {
      this.num = this.createPlaceholder('0', endNum.length - startNum.length) + startNum;

      this.render(this.num);

      this.jumpTo(endNum);
    } else if (endNum.length < startNum.length) { // 280 -> 96
      this.render(startNum.slice(startNum.length - endNum.length));

      startNum = this.num;

      this.num = endNum;

      this.animateDom(startNum, endNum);
    } else {
      this.num = endNum;

      this.animateDom(startNum, endNum);
    }
  };
}
