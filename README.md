## imageview

移动端图片预览器，依赖 `Hammer` 手势库，支持的功能：

- 屏幕旋转

- 删除图片

- 历史栈

- 预加载

### event

`on('pagechange', cur)`：翻页触发

`on('delPic', index, total)`：删除图片触发

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

## swiper

### HTML

    <div class="slider-wrap">
        <ul id="j-slider" class="slider-list">
            <li class="slider-item">1</li>
            <li class="slider-item">2</li>
            <li class="slider-item">3</li>
            <li class="slider-item">4</li>
            <li class="slider-item">5</li>
        </ul>
    </div>
    <div id="j-slider-nav" class="slider-nav"></div>

### LESS

    .slider-list {
        position: relative;
        overflow: hidden;
        margin: 0 auto;
        width: @w;
        height: @h;
    
        .slider-item {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 100%;
        }
    }

### JS

    document.addEventListener('DOMContentLoaded', function () {
        var swiper = new Swiper({
            container: document.querySelector('#j-slider'),
            nav: document.querySelector('#j-slider-nav')
        });

        // bind event
        swiper
            .on('pagechange', function (index, slide) {
            })
            .init();

    }, false);
    
### Refer
    
[thebird swipe](https://github.com/thebird/Swipe)
