# swiper

###HTML

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

###LESS

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

###JS

    document.addEventListener('DOMContentLoaded', function () {
        var swiper = new Swiper({
            container: document.querySelector('#j-slider'),
            nav: document.querySelector('#j-slider-nav')
        });

        // bind event
        swiper
            .on('slideChange', function (index, slide) {
            })
            .on('transitionEnd', function (index, slide) {
            })
            .init();

    }, false);
    
###Refer
    
[thebird swipe](https://github.com/thebird/Swipe)
