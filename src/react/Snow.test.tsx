import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import { instances, liveInstances as live } from '../test/fakeSnow.js';
import { Snow } from './Snow.js';

vi.mock('../core/createSnow.js', () => import('../test/fakeSnow.js'));

beforeEach(() => {
  instances.length = 0;
});

describe('Snow', () => {
  it('renders a hidden overlay canvas', () => {
    const { container } = render(<Snow className='snow' style={{ zIndex: 2 }} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(canvas).toHaveClass('snow');
    expect(canvas).toHaveStyle({ position: 'absolute', pointerEvents: 'none', zIndex: '2' });
  });

  it('starts falling by default', () => {
    render(<Snow />);
    expect(live()[0]?.start).toHaveBeenCalledTimes(1);
  });

  it('passes options through, without its own props', () => {
    render(<Snow falling paused={false} className='snow' density={2} color='#000' />);
    expect(live()[0]?.options).toEqual({ density: 2, color: '#000' });
  });

  it('syncs falling to start and stop', () => {
    const { rerender } = render(<Snow falling={false} />);
    const instance = live()[0];
    expect(instance?.start).not.toHaveBeenCalled();
    expect(instance?.stop).toHaveBeenCalledTimes(1);
    rerender(<Snow falling />);
    expect(instance?.start).toHaveBeenCalledTimes(1);
    rerender(<Snow falling={false} />);
    expect(instance?.stop).toHaveBeenCalledTimes(2);
  });

  it('syncs paused to pause and resume', () => {
    const { rerender } = render(<Snow />);
    const instance = live()[0];
    rerender(<Snow paused />);
    expect(instance?.pause).toHaveBeenCalledTimes(1);
    rerender(<Snow paused={false} />);
    expect(instance?.resume).toHaveBeenCalledTimes(2);
  });

  it('updates the instance when an option prop changes', () => {
    const { rerender } = render(<Snow speed={10} />);
    rerender(<Snow speed={20} />);
    expect(live()[0]?.update).toHaveBeenCalledWith({ speed: 20 });
  });

  it('destroys the instance on unmount', () => {
    const { unmount } = render(<Snow />);
    unmount();
    expect(live()).toHaveLength(0);
  });

  it('leaves one falling instance under StrictMode', () => {
    render(<StrictMode><Snow /></StrictMode>);
    expect(live()).toHaveLength(1);
    expect(live()[0]?.start).toHaveBeenCalled();
  });
});
