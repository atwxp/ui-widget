## lazyload

### Feature

- 默认背景图片

- 图片本身 `<img />` 标签或者背景图片 `background-image`

- 水平/垂直方向

- 阈值设置

- 是否异步

- 是否跳过不可见元素 `display:none; opacity: 0; visibility: hidden;`

- 在同步的情况下当所有图片都加载成功，移除所有事件监听

- 图片加载成功的回调函数

### Usage

加载 `./lazyload/index.less`，凡是设置了 `[data-bglazy]` 属性的元素都会自动带有一张默认背景图

    [data-bglazy] {
        background: #f7f7f7 url(./img/image_default.png) no-repeat center;
    }


加载 `./lazyload/index.js`

    lazyload.init('[data-lazy]', {
        skipInvisible: true
    });

这段代码会一次性（同步）获取 `document.body` 下所有具有 `[data-lazy]` 属性的元素，获取它的 `data-src`，当检测有元素不可见时，跳过它

### basic demo

    <div data-bglazy>
        <img data-src="http://" data-lazy />
    </div>

    <div data-bglazy>
        <div data-src="http://" data-lazy></div>
    </div>

### Load Only Visible Element

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

### Load In Horizontal

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

### Deal With Loaded Image

    lazyload.init('[data-type="clip"]', {
        container: wrapper[0]
    }, clipUser);

### Async Load

这种情况出现在 **下拉加载更多ajax请求下一页** 的情况，每次滚动都会重新 `querySelector` 需要懒加载的图片，所以性能这一块待提升（todo）

    lazyload.init('.c-box-similar-img', {
        container: listEle[0],
        isAsync: true
    });

### Not Image Lazyload

下面这个例子就是当页面滚动到这个区块到时候才加载图片，水平方向懒加载放在了 `swiper` 中的 `preload` 参数处理

    {unit=4}
    {total=list|@count}
    <div class="hotrecom">
        <ul class="hotrecom-list" data-arealazy data-src>
        {each list as key : item}
        {col = key % unit}
        {nextcol = (key + 1) % unit}

        {if col == 0}
        <li class="hotrecom-list-item">
        {/if}

        <div class="hotrecom-list-link">
            <a href="javascript:;" class="hotrecom-list-image {if item@last}hotrecom-list-image-last{/if}" data-bglazy>
                <img data-src="{item.imgUrl}" alt="">
            </a>
        </div>

        {if (key + 1) === total || nextcol == 0}
        </li>
        {/if}
        {/each}
    </ul>

    <div class="hotrecom-dots"></div>
    </div>

    var mySwiper = new Swiper({
        container: document.querySelector('.hotrecom-list')
        nav: document.querySelector('.hotrecom-dots')
        autoplay: false,
        initStart: false,
        type: 'img',
        preload: 1
    });

    Lazyload.init('.hotrecom-list', {
        container: document.querySelector('.hotrecom')
    }, function () {
        if (mySwiper.inited) {
            return;
        }

        mySwiper.start();
    })
