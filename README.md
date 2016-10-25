## lazyload

## 特性

- 默认背景图片

- 图片本身 `<img />` 标签或者背景图片 `background-image`

- 水平/垂直方向

- 阈值设置

- 是否异步

- 是否跳过不可见元素 `display:none; opacity: 0; visibility: hidden;`

- 在同步的情况下当所有图片都加载成功，移除所有事件监听

- 图片加载成功的回调函数

## 使用

加载 `./lazyload/index.less`，凡是设置了 `[data-bglazy]` 属性的元素都会自动带有一张默认背景图

    [data-bglazy] {
        background: #f7f7f7 url(./img/image_default.png) no-repeat center;
    }


加载 `./lazyload/index.js`

    lazyload.init('[data-lazy]', {
        skipInvisible: true
    });

这段代码会一次性（同步）获取 `document.body` 下所有具有 `[data-lazy]` 属性的元素，获取它的 `data-src`，当检测有元素不可见时，跳过它

### 基本使用

    <div data-bglazy>
        <img data-src="http://" data-lazy />
    </div>

    <div data-bglazy>
        <div data-src="http://" data-lazy></div>
    </div>

### 不可见元素不加载

    <ul>
        {%foreach %}
        <li class="{%if%} g-hide {%/if%}">
            <img data-src="http://" data-lazy />
        </li>
        {%/foreach%}
    </ul>
    ul.open {
        .g-hide {
            display: block;
            img {
                visibility: visible;
                // opacity: 1;
            }
        }
    }
    .g-hide {
        display: none;
        img {
            visibility: hidden;
            // opacity: 0;
        }
    }

这是一个很常见的 `点击查看更多` 的功能，对于隐藏的元素我们不对其加载图片，只有当其展开的时候才加载

### 水平方向加载

通常我们都是垂直懒加载图片，但是也存在水平滑动的情况，这时需要我们重新调用 `lazyload.init()` 才能符合我们的需求

    // 类似 swiper 翻页加载
    // doc-list 就是 viewport 的宽度
    lazyload.init('img', {
        container: document.querySelector('.doc-list'),
        threshold: 10,
        isContainer: true,
        isContainerHorizontal: true
    });

    // 另外一种水平加载实现
    // list 不是 viewport 的宽度，但是我们希望处于viewport之外的不加载
    <div class="scroll">
        <div class="list" style="width:192%">
            <div style="width:11%"></div>
            ....
        </div>
    </div>
    .scroll {
        overflow-x: scroll;
    }

    lazyload.init('img', {
        container: document.querySelector('.list'),
        threshold: 10,

        type: 'touchmove',
        viewContainer: null,
        isContainer: true,
        isContainerHorizontal: true
    });

- `isContainer` 表明是否需要在另一个方向检测；

- `isContainerHorizontal` 表明是否另一个方向是水平方向；

- `type` 指定事件类型，如果是通过 `overflow-x:scroll` 实现，需要在能滚动的区域 `container` 监听 `touchmove`

    if (type === 'touchmove') {
        container.addEventListener(type, detectTh, false);
    }

- `viewContainer` 就是指定的水平容器，内部代码如下，即如果不指定默认就是 `container` ，如果是 `null` 则是 `viewport`

    var viewContainer = options.viewContainer;
    if (viewContainer === undefined) {
        viewContainer = container;
    }

水平方向的容器和水平滚动的实现方式有关，具体情况具体分析

### 需要对加载的图片进行处理

    lazyload.init('[data-type="clip"]', {
        container: wrapper[0]
    }, clipUser);

### 异步加载

这种情况出现在 `下拉加载更多ajax请求下一页` 的情况，每次滚动都会重新 `querySelector` 需要懒加载的图片，所以性能这一块待提升（todo）

    lazyload.init('.c-box-similar-img', {
        container: listEle[0],
        isAsync: true
    });

## panelview

## waterfall

### 配置

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
        log: {}
    }, options);

- `main`  瀑布流的父容器

- `loadIcon`  瀑布流本身自带的加载更多icon的容器

- `gapH` 每列之间的间隔

- `gapV` 每列每个元素之间的间隔

- `pinNum` 列数

- `loadUrl` 请求的 url

- `params` 请求的参数

- `render` 渲染模板，string 类型表示是简单的字符串替换，Function 类型表示是前端模板引擎的方法

- `dataUrl` 要加载图片的url字段名，从 ajax 返回的 data 数据中读取

- `hasTotal` 标志该列表是否是已知总数的列表

`log` 日志信息 false 表示不发，默认发送以下日志

    var log = {
        pn: this.page, // 当前页数
        p: this.cur + 1, // 当前页数第几个
        i: this.totalLen - this.loadedLen + this.cur + 1 // 总共第几个
    };


### 事件API

有三个事件

    // 在 update/loaded 事件可以拿到这个值 wf.status
    wf.on('update', function () {});

    // 正在发送 ajax 请求 触发的
    wf.on('loading', function() {});

    // 所有图片加载插入页面内完毕触发
    wf.on('loaded', function () {})

### loadMore()

这个列表必须实现自己的 `loadMore(params, callback)`，这个函数就是一个 ajax 啥也没有

    WaterFall.prototype.loadMore = function (params, callback) {
        var options = this.options;

        var me = this;

        params = $.extend({}, options.params, params);

        this.fire('loading');

        $.ajax({
            type: 'GET',
            url: options.loadUrl,
            data: params,
            success: function (res) {
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

                callback(null);

                me.render(data);
            },
            error: function (err) {
                callback(err);
            }
        });
    };

可以看到这段代码有一个 `this.dealData(data)` 的方法，这个方法可以被实例重写，默认原型方法很简单就是简单的返回 `data`：

    WaterFall.prototype.dealData = function (data) {
        return data.length && data;
    };

之所以这样做，是因为可能有些接口不一致需要在业务内处理数据，比如：

    wf.dealData = function (data) {
         return data.map(function (item) {
              return item.name;
          });
      };

### 使用

    // 页面内引入下面的 html 片段
    <div class="g-waterfall">
         <div class="wf-cnt" data-role="waterfall"></div>
         <div class="wf-loading" data-role="wf-loading">正在加载</div>
     </div>

    // js
    var wfCtrl = ctn.find('[data-role="waterfall"]');
    var wfLoading = ctn.find('[data-role="wf-loading"]');

    var render = ''
            + '<a href="{url}" target="_blank">'
            + '    <img src="{imgSrc}" />'
            + '    <p><em>{tag.0}</em></p>'
            + '</a>';

    var wf = new Waterfall({
        main: wfCtrl,
        loadIcon: wfLoading,
        gap: 10,
        pinNum: 2,
        loadUrl: '/ajax/hot',
        render: render,
        log: false,
        dataUrl: 'imgSrc',
        params: {
            limit: 10
        }
    });

    Viewmore.init(null, {
        list: wf,
        type: 'scroll',
        initLoad: true
    });

## swiper

## imageview

移动端图片预览器，依赖 `Hammer` 手势库，支持的功能：

- 屏幕旋转

- 删除图片

- 历史栈

- 预加载

### event

`on('pagechange', function (cur) {})`：翻页触发

`on('delPic', function (index, total) {})`：删除图片触发

### demo

    <section class="albums" id="j-albums" data-pics="{{data.photo_list}}">
        {{#each data.photo_list photo index}}
        <div class="img-wrap" data-role="img-wrap" data-index="{{index}}">
            <img data-src="{{photo}}" alt="">
        </div>
        {{/each}}
    </section>

    var showImageView = function (pos, wrapper) {
        if (!imageview) {
            // initialize only once
            var imageview = Object.create(ImageView).init({
                elem: wrapper,
                allowHistory: true,
                isFullScreen: false
            });
        }
        else {
            // update
            imageview.update(wrapper);
        }

        imageview.show().go(pos, 0);
    };

    $('#j-albums').on('tap', '[data-role="img-wrap"]', function () {
        showImageView(this.getAttribute('data-index'), this.parentNode);
    });
