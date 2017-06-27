define(function (require, exports, module) {

    function getRatio(context) {
        var devicePixelRatio = window.devicePixelRatio || 1;

        var backingStorePixelRatio = context.webkitBackingStorePixelRatio
            || context.mozBackingStorePixelRatio
            || context.msBackingStorePixelRatio
            || context.oBackingStorePixelRatio
            || context.backingStorePixelRatio
            || 1;

        return devicePixelRatio / backingStorePixelRatio;
    }

    var requestAnimationFrame = window.requestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.msRequestAnimationFrame
        || window.oRequestAnimationFrame
        || function (callback) {
            setTimeout(callback, 1000 / 60);
        };

    var cancelAnimationFrame = window.cancelAnimationFrame
        || window.mozCancelAnimationFrame
        || window.webkitCancelAnimationFrame
        || window.msCancelAnimationFrame
        || window.oCancelAnimationFrame
        || function (timer) {
            clearTimeout(timer);
        };

    /**
     * 获取数据点相对于原点的坐标
     *
     * @param {number} n 多边形边数
     * @param {Array}  dataRadiusArr 数据点的坐标数组
     * @param {Array}  angleArr 多边形的角度数组
     *
     * @return {Array}
     */
    function getDataPointsPos(n, dataRadiusArr, angleArr) {
        var dataPointsPosArray = [];

        for (var i = 0; i < n; i++) {
            dataPointsPosArray.push({
                x: dataRadiusArr[i] * Math.sin(angleArr[i]),

                y: -dataRadiusArr[i] * Math.cos(angleArr[i])
            });
        }

        return dataPointsPosArray;
    }

    function drawCircle(context, options) {
        var x = options.x || 0;

        var y = options.y || 0;

        var r = options.r || 10;

        var originX = options.originX || 0;

        var originY = options.originY || 0;

        var strokeStyle = options.strokeStyle || '#000';

        var lineWidth = options.lineWidth || 2;

        var fillStyle = options.fillStyle || '#fff';

        context.save();

        context.beginPath();

        context.translate(originX, originY);

        context.arc(x, y, r, 0, Math.PI * 2);

        context.closePath();

        context.strokeStyle = strokeStyle;

        context.lineWidth = lineWidth;

        context.lineJoin = 'round';

        context.fillStyle = fillStyle;

        context.stroke();

        context.fill();

        context.restore();
    }

    function drawDataCircle(context, options) {
        var strokeStyle = options.strokeStyle || '#000';

        var fillStyle = options.fillStyle || '#222';

        var dataPointsPosArray = options.dataPoints || [];

        for (var i = 0, l = dataPointsPosArray.length; i < l; i++) {
            drawCircle(context, {
                x: dataPointsPosArray[i].x,

                y: dataPointsPosArray[i].y,

                r: options.r,

                originX: options.origin[0],

                originY: options.origin[1],

                strokeStyle: strokeStyle,

                lineWidth: options.lineWidth,

                fillStyle: fillStyle
            });
        }
    }

    /**
     * 绘制数据点连接线条
     *
     * @param {Object} context canvas's context
     * @param {Object} options 配置
     * @property {string} strokeStyle 线条样式
     * @property {string} fillStyle 线条样式
     * @property {number} lineWidth 线条宽度
     * @property {Array} origin 正多边形的中心位置。数组形式[x, y]
     * @property {Array} dataPoints 数据的位置数组
     */
    function drawDataLineFill(context, options) {
        var strokeStyle = options.strokeStyle || 'red';

        var fillStyle = options.fillStyle || 'transparent';

        var lineWidth = options.lineWidth || 2;

        var dataPointsPosArray = options.dataPoints || [];

        context.save();
        context.beginPath();

        context.translate(options.origin[0], options.origin[1]);

        context.moveTo(dataPointsPosArray[0].x, dataPointsPosArray[0].y);

        for (var i = 1, l = dataPointsPosArray.length; i < l; i++) {
            context.lineTo(dataPointsPosArray[i].x, dataPointsPosArray[i].y);
        }

        context.closePath();

        context.strokeStyle = strokeStyle;

        context.lineWidth = lineWidth;

        context.lineJoin = 'round';

        context.stroke();

        context.fillStyle = fillStyle;

        context.fill();

        context.restore();
    }

    /**
     * 获取正多边形每个点的坐标位置数组（相对于原点）
     *
     * @param {number} n 边数
     * @param {number} r 半径
     * @param {Array} origin 正多边形的中心位置。数组形式[x, y]
     *
     * @return {Array}
     */
    function getPolygonPos(n, r, origin) {
        // 多边形每一个点的坐标数组，格式如[{x: 1, y: 2}]
        var dotsArray = [];
        var angle = Math.PI * 2 / n;

        for (var i = 0; i < n; i++) {
            dotsArray.push({
                x: r * Math.sin(i * angle) + origin[0],
                y: -r * Math.cos(i * angle) + origin[1]
            });
        }

        return dotsArray;
    }

    /**
     * 绘制闭合正多边形
     *
     * @param {Object} context canvas's context
     * @param {Object} options 配置
     * @property {number} n 边数
     * @property {number} r 半径
     * @property {Array} origin 正多边形的中心位置。数组形式[x, y]
     * @property {string} fillStyle 填充样式
     * @property {string} strokeStyle 线条样式
     * @property {string} lineWidth 线条宽度
     * @property {string} lineCap线条终点的绘制方式
     */
    function drawPolygon(context, options) {
        var n = options.n;

        var r = options.r;

        var origin = options.origin || [0, 0];

        var lineCap = options.lineCap || 'butt';

        context.save();
        context.beginPath();

        var angle = Math.PI * 2 / n;

        context.translate(origin[0], origin[1]);
        context.moveTo(0, -r);

        for (var i = 0; i < n; i++) {
            context.rotate(angle);
            context.lineTo(0, -r);
        }
        context.closePath();

        if (options.strokeStyle) {
            context.strokeStyle = options.strokeStyle;
            context.lineWidth = options.lineWidth;
            context.lineCap = lineCap;
            context.stroke();
        }

        if (options.fillStyle) {
            context.fillStyle = options.fillStyle;
            context.fill();
        }

        context.restore();
    }

    /**
     * 绘制雷达的背景图
     *
     * @param {Object} context canvas's context
     * @param {Object} options 配置
     * @property {number} n 边数
     * @property {number} r 半径
     * @property {Array} origin 正多边形的中心位置。数组形式[x, y]
     * @property {string} oddStrokeStyle index为奇数的多边形的描边样式
     * @property {string} oddFillStyle index为奇数的多边形的描边样式
     * @property {string} evenStrokeStyle index为偶数的多边形的描边样式
     * @property {string} evenFillStyle index为偶数的多边形的描边样式
     */
    function drawRadarBackground(context, options) {
        var layer = options.layer;

        for (var i = 0; i < layer; i++) {
            drawPolygon(context, {
                n: options.n,

                r: options.r / layer * (layer - i),

                origin: options.origin || [0, 0],

                fillStyle: i % 2 !== 0 ? options.evenFillStyle : options.oddFillStyle,

                strokeStyle: i % 2 !== 0 ? options.evenStrokeStyle : options.oddStrokeStyle,

                lineWidth: options.lineWidth
            });
        }

        context.save();

        context.beginPath();

        var polygonOuterPointsPosArr = getPolygonPos(options.n, options.r, options.origin);

        for (i = 0; i < options.n; i++) {
            context.moveTo(options.origin[0], options.origin[1]);

            context.lineTo(polygonOuterPointsPosArr[i].x, polygonOuterPointsPosArr[i].y);
        }

        context.strokeStyle = options.evenStrokeStyle;

        context.lineWidth = options.lineWidth;

        context.stroke();

        context.restore();
    }

    function radar(element, options) {
        if (!element) {
            return;
        }

        var elementWidth = element.offsetWidth;
        var elementHeight = element.offsetHeight;

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');

        var ratio = getRatio(context) || 1;

        canvas.width = elementWidth * ratio;
        canvas.height = elementHeight * ratio;

        canvas.style.width = elementWidth + 'px';
        canvas.style.height = elementHeight + 'px';

        element.appendChild(canvas);

        // config参数初始化默认值
        var userConfig = util.extend({
            scale: 1,
            origin: [canvas.width / 2, canvas.height / 2]
        }, options.config || {});

        userConfig.radius = userConfig.radius * ratio;

        // 背景图的config设置默认参数
        userConfig.bg = util.extend({
            layer: 5,

            evenFillStyle: '#fff',

            oddFillStyle: '#eee',

            evenStrokeStyle: '#ddd',

            oddStrokeStyle: '#ddd',

            lineWidth: 1
        }, userConfig.bg || {});

        userConfig.bg.lineWidth = userConfig.bg.lineWidth * ratio;

        // 数据填充多边形的config设置参数
        userConfig.dataFill = util.extend({
            fillStyle: 'transparent'
        }, userConfig.dataFill || {});

        // 数据线条的config设置参数
        userConfig.dataLine = util.extend({
            strokeStyle: 'transparent',

            lineWidth: 1
        }, userConfig.dataLine || {});

        userConfig.dataLine.lineWidth = userConfig.dataLine.lineWidth * ratio;

        // 数据点圆圈的config设置参数
        userConfig.dataCircle = util.extend({
            r: 2,

            strokeStyle: '#fff',

            lineWidth: 1,

            fillStyle: '#fff'
        }, userConfig.dataCircle || {});

        userConfig.dataCircle.lineWidth = userConfig.dataCircle.lineWidth * ratio;

        userConfig.dataCircle.r = userConfig.dataCircle.r * ratio;

        // data参数初始化默认值
        var data = util.extend({
            value: [],

            maxValue: []
        }, options.data || {});

        // 构建程序需要的基本数据对象
        var baseConfig = {
            n: data.value && data.value.length || 0,

            dataRadiusOfPercent: [],

            dataRadius: [],

            angleArr: []
        };
        for (var i = 0; i < baseConfig.n; i++) {
            baseConfig.dataRadiusOfPercent[i] = data.value[i] / data.maxValue[i];

            baseConfig.dataRadius[i] = baseConfig.dataRadiusOfPercent[i] * userConfig.radius * userConfig.scale;

            baseConfig.angleArr[i] = i * Math.PI * 2 / baseConfig.n;
        }

        function drawCanvasAnimation() {
            var radiusPrecent = 0;

            var timer = null;

            (function drawFrame() {
                timer = requestAnimationFrame(drawFrame, canvas);

                radiusPrecent += 0.1;

                if (radiusPrecent >= 1) {
                    cancelAnimationFrame(timer);
                }

                var dataRadius = baseConfig.dataRadius.map(function (value, index) {
                    return value * radiusPrecent;
                });
                var dataPointsPosArray = getDataPointsPos(baseConfig.n, dataRadius, baseConfig.angleArr);

                // 清空画布
                context.clearRect(0, 0, canvas.width, canvas.height);

                // 绘制背景图
                drawRadarBackground(context, {
                    layer: userConfig.bg.layer,

                    n: baseConfig.n,

                    r: userConfig.radius,

                    origin: userConfig.origin,

                    evenFillStyle: userConfig.bg.evenFillStyle,

                    oddFillStyle: userConfig.bg.oddFillStyle,

                    evenStrokeStyle: userConfig.bg.evenStrokeStyle,

                    oddStrokeStyle: userConfig.bg.oddStrokeStyle,

                    lineWidth: userConfig.bg.lineWidth
                });

                // 绘制数据点连接线条
                drawDataLineFill(context, {
                    dataPoints: dataPointsPosArray,

                    strokeStyle: userConfig.dataLine.strokeStyle,

                    lineWidth: userConfig.dataLine.lineWidth,

                    fillStyle: userConfig.dataFill.fillStyle,

                    origin: userConfig.origin
                });

                // 绘制数据点圆圈
                drawDataCircle(context, {
                    dataPoints: dataPointsPosArray,

                    r: userConfig.dataCircle.r,

                    strokeStyle: userConfig.dataCircle.strokeStyle,

                    fillStyle: userConfig.dataCircle.fillStyle,

                    lineWidth: userConfig.dataCircle.lineWidth,

                    origin: userConfig.origin
                });
            })();
        }

        drawCanvasAnimation();
    }

    exports.init = radar;

});
