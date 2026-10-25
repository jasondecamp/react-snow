import { act, render } from '@testing-library/react';
import { StrictMode, useEffect } from 'react';
import type { SnowOptions } from '../core/types.js';
import { instances, liveInstances as live } from '../test/fakeSnow.js';
import type { SnowControls } from './useSnow.js';
import { useSnow } from './useSnow.js';

vi.mock('../core/createSnow.js', () => import('../test/fakeSnow.js'));

let controls: SnowControls;

const Harness = ({ options, showCanvas = true }: { options?: SnowOptions; showCanvas?: boolean }) => {
  const latest = useSnow(options);
  const { ref } = latest;
  useEffect(() => {
    controls = latest;
  });
  return showCanvas ? <canvas ref={ref} /> : null;
};

beforeEach(() => {
  instances.length = 0;
});

describe('useSnow', () => {
  it('creates an idle instance with the initial options', () => {
    render(<Harness options={{ density: 2 }} />);
    expect(live()).toHaveLength(1);
    expect(live()[0]?.options).toEqual({ density: 2 });
    expect(live()[0]?.start).not.toHaveBeenCalled();
  });

  it('forwards the control functions', () => {
    render(<Harness />);
    const instance = live()[0];
    act(() => {
      controls.start();
      controls.pause();
      controls.resume();
      controls.stop();
      controls.clear();
    });
    expect(instance?.start).toHaveBeenCalledTimes(1);
    expect(instance?.pause).toHaveBeenCalledTimes(1);
    expect(instance?.resume).toHaveBeenCalledTimes(1);
    expect(instance?.stop).toHaveBeenCalledTimes(1);
    expect(instance?.clear).toHaveBeenCalledTimes(1);
  });

  it('keeps control functions stable across renders', () => {
    const { rerender } = render(<Harness options={{ speed: 1 }} />);
    const first = controls;
    rerender(<Harness options={{ speed: 2 }} />);
    expect(controls.start).toBe(first.start);
    expect(controls.ref).toBe(first.ref);
  });

  it('updates only the options that changed', () => {
    const { rerender } = render(<Harness options={{ speed: 1, size: [2, 6], color: '#fff' }} />);
    const instance = live()[0];
    rerender(<Harness options={{ speed: 1, size: [2, 6], color: '#fff' }} />);
    expect(instance?.update).not.toHaveBeenCalled();
    rerender(<Harness options={{ speed: 3, size: [2, 6] }} />);
    expect(instance?.update).toHaveBeenCalledWith({ speed: 3, color: undefined });
  });

  it('compares flake shapes by value', () => {
    const { rerender } = render(<Harness options={{ flake: { svg: '<svg/>' } }} />);
    const instance = live()[0];
    rerender(<Harness options={{ flake: { svg: '<svg/>' } }} />);
    expect(instance?.update).not.toHaveBeenCalled();
    rerender(<Harness options={{ flake: { src: 'flake.png' } }} />);
    expect(instance?.update).toHaveBeenCalledWith({ flake: { src: 'flake.png' } });
  });

  it('applies a start made before the canvas mounts', () => {
    const { rerender } = render(<Harness showCanvas={false} />);
    act(() => controls.start());
    rerender(<Harness />);
    expect(live()[0]?.start).toHaveBeenCalledTimes(1);
  });

  it('destroys the instance on unmount', () => {
    const { unmount } = render(<Harness />);
    unmount();
    expect(live()).toHaveLength(0);
  });

  it('leaves exactly one live instance under StrictMode', () => {
    render(<StrictMode><Harness /></StrictMode>);
    expect(live()).toHaveLength(1);
    act(() => controls.start());
    expect(live()[0]?.start).toHaveBeenCalled();
  });
});
