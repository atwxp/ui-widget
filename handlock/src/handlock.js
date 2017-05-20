// http://jiaolonghuang.github.io/2015/11/16/bug-canvas/
// https://www.html5rocks.com/en/tutorials/canvas/hidpi/

import { retinaCanvas } from './lib/util';
import ontouch from './lib/touch';
import Emitter from './lib/emitter';
import Record from './record';

export default class Handlock extends Emitter {
    constructor(options) {
        super();

        const defaultOptions = {
            container: '',

            col: 3,

            row: 3,

            lineWidth: 1,

            activeColor: 'orange',

            circleLineWidth: 1,

            radius: 20,

            innerRadius: 10
        };

        this.init(Object.assign(defaultOptions, options));
    }

    init(options = {}) {
        this.options = options;

        try {
            options.container = document.querySelector(options.container);
        }

        catch (e) {
            options.container = '';
        }

        if (!options.container) {
            return;
        }

        this.circles = [];

        this.record = new Record();

        this.mode = 0;

        this.startPos = [];

        // get canvas width/height
        const { left, top, width: canvasW, height: canvasH } = options.container.getBoundingClientRect();

        // get margin, layout center
        options.gapLeft = left;
        options.gapTop = top;
        options.gapH = canvasW / (options.col + 1);
        options.gapV = canvasH / (options.row + 1);

        // render circle/line canvas, we use two canvas
        this.circleCanvas = retinaCanvas(document.createElement('canvas'), canvasW, canvasH);
        this.lineCanvas = retinaCanvas(this.circleCanvas.cloneNode(true), canvasW, canvasH);

        options.container.appendChild(this.lineCanvas);
        options.container.appendChild(this.circleCanvas);

        // clear canvas
        this.clearCanvas();

        // bind touch events on circle canvas
        ontouch(this.circleCanvas, this, {
            preventScroll: true
        });

        this.bindEvents();
    }

    detectCircle(x, y) {
        const { radius, circleLineWidth } = this.options;

        const rw = radius + circleLineWidth;

        let inCircle = false;

        for (let c of this.circles) {
            if (x <= c.x + rw && x >= c.x - rw && y <= c.y + rw && y >= c.y - rw) {
                if (this.record.add(c.id)) {
                    console.log(c)
                    
                    this.activeCircleCanvas(c);

                    inCircle = true;

                    this.startPos.push({
                        x: c.x,
                        y: c.y
                    });

                    break;
                }
            }
        }

        return inCircle;
    }

    updateMode(mode) {
        this.mode = mode;

        switch (mode) {
            case 0: 
                console.log('设置密码');
                break;

            case 1:
                console.log('再次输入密码');
                break;

            case 2: 
                console.log('验证密码');
                break;
            default:
        }
    }

    reset() {
        this.clearCanvas();
        this.record.reset();
    }

    bindEvents() {
        const record = this.record;

        const { container, gapLeft, gapTop } = this.options;

        // prevent container scroll
        container.addEventListener('touchstart', e => e.preventDefault(), { passive: false });

        const me = this;

        const startPos = {x: 0, y: 0};

        let prevPwd;

        this.on('error', err => {
            this.reset();
            console.log(err.msg);
        });

        this.on('afterFirstConfirm', data => {
            prevPwd = data;

            this.reset();

            me.updateMode(1);
        });

        this.on('afterSecondConfirm', () => {
            prevPwd = null;

            this.reset();

            me.updateMode(2);
        });

        this.on('afterConfirm', () => {
            this.reset();

            me.updateMode(0);
        });

        this.on('touchstart', pos => {
            console.log('touchstart...');

            record.recording = this.detectCircle(pos.startX - gapLeft, pos.startY - gapTop);            
        });

        this.on('touchmove', (dir, pos) => {
            console.log('touchmove...');

            if (!record.recording) {
                return;
            }

            // draw line
            this.drawLine(this.startPos, {x: pos.currentX, y: pos.currentY});

            // draw active circle
            this.detectCircle(pos.currentX - gapLeft, pos.currentY - gapTop);
        });

        this.on('touchend', () => {
            console.log('touchend...');

            if (!record.recording) {
                return;
            }

            console.log('touchend mode before: ', this.mode, this.record.data);

            switch (this.mode) {
                // 设置密码
                case 0:
                    const minLen = record.checkLength();

                    // 进入 “再次确认密码”
                    if (minLen === true) {
                        this.fire('afterFirstConfirm', record.data);
                    }

                    else {
                        this.fire('error', {
                            type: 'len',
                            msg: '密码长度至少' + minLen + '位...'
                        });
                    }

                    break;

                // 再次确认密码
                case 1:
                    if (record.checkSame(prevPwd)) {
                        record.save()
                            .then(() => {
                                me.fire('afterSecondConfirm');
                            })
                    }
                    else {
                        this.fire('error', {
                            type: 'second',
                            msg: '密码和第一次不一样...'
                        });
                    }

                    break;

                // 输入密码
                case 2:
                    record.checkValid()
                        .then(() => {
                            me.fire('afterConfirm');
                        })
                        .catch(() => {
                            me.fire('error', {
                                type: 'confirm',
                                msg: '密码不正确...'
                            });
                        });
                    
                    break;

                default:
            }

        });
    }

    drawLine(startList, endpoint) {
        const context = this.lineCanvas.getContext('2d');

        context.clearRect(0, 0, this.lineCanvas.width, this.lineCanvas.height);

        const { lineWidth, activeColor } = this.options;

        context.strokeStyle = activeColor;

        context.beginPath();

        for (let i = 0; i < startList.length; i++) {
            const { x, y } = startList[i];

            if (i === 0) {
                context.moveTo(x, y);
            }
            else {
                context.lineTo(x, y);
            }
        }

        context.lineTo(endpoint.x, endpoint.y);

        context.stroke();
    }

    clearCanvas() {
        const context = this.circleCanvas.getContext('2d');
        const lineContext = this.lineCanvas.getContext('2d');

        context.clearRect(0, 0, this.circleCanvas.width, this.circleCanvas.height);
        lineContext.clearRect(0, 0, this.lineCanvas.width, this.lineCanvas.height);

        this.startPos = [];

        const { row, col, gapH, gapV, radius, circleLineWidth } = this.options;
        
        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {
                const x = (j + 1) * gapH;
                const y = (i + 1) * gapV;

                this.circles.push({
                    x, y,
                    pos: [i, j],
                    id: i * row + j
                });

                this.drawCircle(context, x, y, radius, circleLineWidth);
            }
        }
    }

    activeCircleCanvas(circle) {
        const context = this.circleCanvas.getContext('2d');

        const { radius, circleLineWidth, innerRadius, activeColor } = this.options;

        this.drawCircle(context, circle.x, circle.y, radius, circleLineWidth, activeColor);

        this.drawCircle(context, circle.x, circle.y, innerRadius, circleLineWidth, activeColor, activeColor);
    }

    drawCircle(context, x, y, r, lineWidth = 1, strokeColor ='#000', fillColor = 'transparent') {
        context.beginPath();

        context.lineWidth = lineWidth;

        context.strokeStyle = strokeColor;

        context.fillStyle = fillColor;

        context.arc(x, y, r, 0, 2 * Math.PI, true);

        context.closePath();

        context.stroke();

        context.fill();
    }

    dispose() {
        this.options = null;
        this.circles = null;
        this.startPos = null;
        this.circleCanvas = null;
        this.lineCanvas = null;
        this.record.dispose();
    }
}
