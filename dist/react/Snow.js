import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useSnow } from './useSnow.js';
// The library ships no CSS, so the overlay defaults are inline.
const overlayStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
};
/**
 * Declarative snow: a canvas that fills its nearest positioned ancestor.
 * `falling` and `paused` are its state; every other prop is a snow option.
 */
export const Snow = ({ falling = true, paused = false, className, style, ...options }) => {
    const { ref, start, stop, pause, resume } = useSnow(options);
    useEffect(() => {
        if (falling)
            start();
        else
            stop();
    }, [falling, start, stop]);
    useEffect(() => {
        if (paused)
            pause();
        else
            resume();
    }, [paused, pause, resume]);
    return (_jsx("canvas", { ref: ref, className: className, style: { ...overlayStyle, ...style }, "aria-hidden": true }));
};
//# sourceMappingURL=Snow.js.map