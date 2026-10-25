import { useCallback, useEffect, useRef } from 'react';
import { createSnow } from '../core/createSnow.js';
const sameValue = (a, b) => {
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
    }
    return Object.is(a, b);
};
/** The options whose values differ between two renders; removed keys come back as `undefined` (the default). */
const changedOptions = (previous, next) => {
    const changes = {};
    let changed = false;
    const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
    for (const key of keys) {
        if (!sameValue(previous[key], next[key])) {
            changes[key] = next[key];
            changed = true;
        }
    }
    return changed ? changes : null;
};
/**
 * Imperative snow. Attach `ref` to a `<canvas>` and call `start()` to begin.
 * Options are live: re-render with new values and only the changed ones are
 * applied. The instance lives as long as the canvas is mounted.
 */
export const useSnow = (options = {}) => {
    const instanceRef = useRef(null);
    const appliedOptionsRef = useRef(options);
    // Control state outlives any one instance, so a call made before the canvas
    // mounts (or across a remount) still takes effect.
    const controlStateRef = useRef({ spawning: false, paused: false });
    const ref = useCallback((canvas) => {
        if (canvas == null)
            return undefined;
        const instance = createSnow(canvas, appliedOptionsRef.current);
        if (controlStateRef.current.paused)
            instance.pause();
        if (controlStateRef.current.spawning)
            instance.start();
        instanceRef.current = instance;
        return () => {
            instance.destroy();
            if (instanceRef.current === instance)
                instanceRef.current = null;
        };
    }, []);
    useEffect(() => {
        const changes = changedOptions(appliedOptionsRef.current, options);
        appliedOptionsRef.current = options;
        if (changes != null)
            instanceRef.current?.update(changes);
    });
    const start = useCallback(() => {
        controlStateRef.current.spawning = true;
        instanceRef.current?.start();
    }, []);
    const stop = useCallback(() => {
        controlStateRef.current.spawning = false;
        instanceRef.current?.stop();
    }, []);
    const pause = useCallback(() => {
        controlStateRef.current.paused = true;
        instanceRef.current?.pause();
    }, []);
    const resume = useCallback(() => {
        controlStateRef.current.paused = false;
        instanceRef.current?.resume();
    }, []);
    const clear = useCallback(() => {
        instanceRef.current?.clear();
    }, []);
    return { ref, start, stop, pause, resume, clear };
};
//# sourceMappingURL=useSnow.js.map