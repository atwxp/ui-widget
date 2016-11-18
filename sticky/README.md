# 吸顶tab

优先使用 `sticky` 属性，不支持的使用 `scroll` 事件

## 属性API

### options

    function Sticky(options) {
        options = util.extend({
            elem: '',

            scroll: true,

            stickyCls: 'sticky',

            fixedCls: 'fixed'
        }, options);

        this.init(options);
    }

-  `elem`：`zepto` 对象，要吸顶的元素

- `scroll`：`boolean`，是否对不支持的浏览器进行 `fallback`

- `stickyCls`：`string`，动态添加支持 `sticky`  属性的类，需要在 css 中写好

- `fixedCls`：`string`，动态添加不支持 `sticky` 需要 `fixed` 的类

## 事件API

### scroll 页面滚动事件

    var fixedSticky = new Sticky({
        elem: nav
    })

    fixedSticky.on('scroll', (isSticky, pageY, elemTop) => {});

## Use

    <div class="tab">
        <div class="tab-title">
            <ul>
                <li>1</li>
                <li>1</li>
            </ul>
            <span class="tab-line"></span>
        </div>
    </div>

    // less
    .tab {
        height: 38px;
        line-height: 38px;

        &.sticky {
            position: -o-sticky;
            position: -ms-sticky;
            position: -moz-sticky;
            position: -webkit-sticky;
            position: sticky;
            top: 0;
            z-index: 2;
        }

        &.fixed {
            .tab-title {
                position: fixed;
                left: 0;
                top: 0;
                right: 0;
                z-index: 2;
            }
        }
        .tab-title {
            position: relative;

            > ul {
                display: flex;

                > li {
                    -webkit-box-flex: 1;
                    -moz-box-flex: 1;
                    -ms-flex: 1 1 auto;
                    -webkit-flex: 1 1 auto;
                    flex: 1 1 auto;

                    text-align: center;
                    &.active {
                        color: #38f;
                    }
                }
            }
            .tab-line {
                opacity: 0;
                position: absolute;
                left: 0;
                bottom: 0;
                height: 1px;
                background: #38f;
                -webkit-transition: transform .5s;
                transition: transform .5s;

                &.tab-line-active {
                    opacity: 1;
                }
            }
        }
     }

    // js
    import Sticky from './sticky/index';

    new Sticky({
        elem: '.tab'
    })
