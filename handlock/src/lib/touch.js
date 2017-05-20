import { throttle } from './util';

export default function ontouch(touchsurface, ctx, options = {}) {
    let startX;
    let startY;
    let startTime;

    let dir;
    let distX;
    let distY;

    const { threshold = 50, restraint = 100, allowedTime = 250 } = options;

    touchsurface.addEventListener('touchstart', e => {
        var touchObj = e.targetTouches[0];

        startX = touchObj.clientX;
        startY = touchObj.clientY;
        startTime = +new Date();

        ctx.fire('touchstart', { startX, startY });
    }, { passive: true });

    touchsurface.addEventListener('touchmove', throttle(function (e) {
        // only one finger
        if (e.targetTouches.length > 1 || (e.scale && e.scale > 1)) {
            return;
        }

        if (options.preventScroll) {
            e.preventDefault();
        }

        const { clientX: currentX, clientY: currentY } = e.targetTouches[0];

        distX = currentX - startX;
        distY = currentY - startY;

        if (Math.abs(distX) < Math.abs(distY)) {
            dir = distY > 0 ? 'down' : 'up';
        }
        else {
            dir = distX > 0 ? 'right' : 'left';
        }

        ctx.fire('touchmove', dir, { currentX, currentY, distX, distY });

    }, 100), { passive: !options.preventScroll });

    touchsurface.addEventListener('touchend', e => {
        let elapsedTime = +new Date() - startTime;

        ctx.fire('touchend');

        if (elapsedTime <= allowedTime) {
            if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
                ctx.fire('swipe' + dir, distX);
            }
            else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
                ctx.fire('swipe' + dir, distY);
            }
            else {
                ctx.fire('release', dir === 'left' || dir === 'right' ? distX : distY);
            }
        }
        else {
            ctx.fire('release', dir === 'left' || dir === 'right' ? distX : distY);
        }
    });
}
