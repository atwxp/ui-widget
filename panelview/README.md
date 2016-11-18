## PanelView

项目中会存在一些很长的页面需要锚点快速定位，同时需要滚动一定距离 `fixed` 这个 `bar` 到视口之内，效果可参考 [https://m.nuoi.com/](https://m.nuoi.com/)

### options

    this.options = {
        main: '',
        map: {},
        thresold: 0,
        proportion: .8
    };

- `main`: `Zepto`, the wrapper contains for nav&panel

- `map`: `Object`, nav panel map

- `thresold`: `number`, thresold for scroll

- `proportion`: `number`, the body proportion to be change nav

### Prototype Function

- `scrollToPanel(index)`：手动跳转到第几个 `nav&pagel`

- `scrollBack()`：`scroll` 事件绑定的回调

- `isInViewport(scrollTop)`：滚动了 `scrollTop` 距离之后 `panel` 是否还在视口之内

- `dispose()`：销毁实例

### Props

- `this.cur`：当前高亮的索引

### Event API

- `on('scroll', function (e, oldCur, cur, pageY, inview) {})`：监听页面滚动事件

- `on('change', function (e, cur) {})`：手动跳转 `scrollToPanel()` 内触发

### Demo

    <div class="wrapper">
        <div class="tab">
            <div class="tab-title">
                <ul>
                    <li class="nav-item nav-item1">nav1</li>
                    <li class="nav-item nav-item2">nav2</li>
                    <li class="nav-item nav-item3">nav3</li>
                <ul>
                <span class="nav-line" style="width:33.3%;"></span>
            </div>
        </div>

        <div class="panel-item1"></div>
        <div class="panel-item2"></div>
        <div class="panel-item3"></div>
    </div>

    // less
    .tab {
        height: 44px;
        .tab-title {
            position: relative;
            &.fixed {
                position: fixed;
                left: 0;
                top: 0;
                right: 0;
            }
        }
        .nav-item {
            text-align: center;

            &.nav-item-active {
                color: #0067fd;
            }
        }
        .nav-line {
            opacity: 0;
            position: absolute;
            left: 0;
            bottom: 0;
            height: 1px;
            -webkit-transition: transform .5s;
            transition: transform .5s;

            &.nav-line-active {
                opacity: 1;
            }
        }
    }

    // js
    var wrapper = $('.wrapper');
    var nav = $('.tab');
    var navItems = nav.find('.nav-item');
    var navLine = nav.find('.nav-line');

    var navTop = nav.offset().top;
    var map = {};
    navItems.each(function (i) {
        map['.nav-item' + (i + 1)] = '.panel-item' + (i + 1);
    });
    var pview = new Panelview({
        main: wrapper,
        map: map,
        thresold: -44
    });
    var toggleShow = function (cur, inview) {
        navLine[inview ? 'addClass' : 'removeClass']('nav-line-active');
        navLine.css({
            '-webkit-transform': 'translateX(' + 100 * cur + '%)',
            'transform': 'translateX(' + 100 * cur + '%)'
        });
        navItems.removeClass('nav-item-active').eq(cur).addClass('nav-item-active');
    };

    // 手动点击nav
    pview.on('change', function () {
        nav.addClass('fixed');
    });
    // 页面滚动事件
    pview.on('scroll', function (e, oldCur, cur, pageY, inview) {
        nav[pageY > navTop ? 'addClass' : 'removeClass']('fixed');
        toggleShow(cur, inview);

        // 索引发生改变
        if (oldCur !== cur) {
            sendLog();
        }
    });
    pview.init();

    // 页面初始化时高亮
    pview.scrollBack();
