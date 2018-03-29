## Waterfall

瀑布流

### options

```js
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
```

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

- `log` 日志信息 false 表示不发，默认发送以下日志

  ```js
  var log = {
    pn: this.page, // 当前页数
    p: this.cur + 1, // 当前页数第几个
    i: this.totalLen - this.loadedLen + this.cur + 1 // 总共第几个
  };
  ```

### Event API

有三个事件

```js
// 在 update/loaded 事件可以拿到这个值 wf.status
wf.on('update', function() {});

// 正在发送 ajax 请求 触发的
wf.on('loading', function() {});

// 所有图片加载插入页面内完毕触发
wf.on('loaded', function() {});
```

### loadMore()

这个列表必须实现自己的 `loadMore(params, callback)`，这个函数就是一个 ajax 啥也没有

```js
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
```

可以看到这段代码有一个 `this.dealData(data)` 的方法，这个方法可以被实例重写，默认原型方法很简单就是简单的返回 `data`：

```js
WaterFall.prototype.dealData = function (data) {
  return data.length && data;
};
```

之所以这样做，是因为可能有些接口不一致需要在业务内处理数据，比如：

```js
wf.dealData = function (data) {
  return data.map(function (item) {
    return item.name;
  });
};
```

### Usage

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
