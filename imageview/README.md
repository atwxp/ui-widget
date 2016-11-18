## Imageview

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
