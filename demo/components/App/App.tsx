import classNames from 'classnames';
import { useState } from 'react';
import { Snow } from 'react-snow';
import type { SnowOptions } from 'react-snow';
import { defaultOptions } from 'react-snow/core';
import { Controls } from '../Controls/Controls';
import type { ControlValue } from '../Controls/ControlsContext';
import { Logo } from '../Logo/Logo';
import { SkyToggle } from '../SkyToggle/SkyToggle';
import styles from './App.module.scss';

type Options = Required<SnowOptions>;

const formatValue = (value: ControlValue) => {
  if (typeof value === 'string') return `'${value}'`;
  if (Array.isArray(value)) return `{[${value.map((item) => (typeof item === 'string' ? `'${item}'` : item)).join(', ')}]}`;
  return `{${String(value)}}`;
};

// Options that only apply while a toggle is on, matching the controls nested in
// each Controls.Toggle below. While the toggle is off, the snippet leaves them out.
const parentToggles: Partial<Record<keyof Options, keyof Options>> = {
  pointerStrength: 'followPointer',
  groundTime: 'stick',
};

const isActive = (options: Options, key: keyof Options) => {
  const toggle = parentToggles[key];
  return toggle == null || options[toggle] === true;
};

/** The JSX for the current settings, listing only active options that differ from the defaults. */
const snippet = (options: Options) => {
  const props = (Object.keys(options) as (keyof Options)[])
    .filter((key) => isActive(options, key))
    .filter((key) => JSON.stringify(options[key]) !== JSON.stringify(defaultOptions[key]))
    .map((key) => `  ${key}=${formatValue(options[key])}`);
  return props.length === 0 ? '<Snow />' : `<Snow\n${props.join('\n')}\n/>`;
};

// The playground: a full-window scene with <Snow> behind a panel of controls
// for every option, for tuning defaults by eye.
export const App = () => {
  const [options, setOptions] = useState<Options>(defaultOptions);
  const [falling, setFalling] = useState(true);
  const [paused, setPaused] = useState(false);
  const [isDay, setIsDay] = useState(false);
  // Remounting <Snow> is the declarative clear (and applies prefill).
  const [snowKey, setSnowKey] = useState(0);

  const setOption = (name: string, value: ControlValue) => setOptions((current) => ({ ...current, [name]: value }));

  return (
    <main className={classNames(styles.scene, isDay && styles.day)}>
      <Snow key={snowKey} falling={falling} paused={paused} {...options} />
      <Logo isDay={isDay} />
      <aside className={styles.panel}>
        <header className={styles.header}>
          <h1 className={styles.title}>react-snow playground</h1>
          <SkyToggle isDay={isDay} onChange={setIsDay} />
        </header>
        <div className={styles.actions}>
          <button type='button' className={styles.button} onClick={() => setFalling(!falling)}>
            {falling ? 'Stop falling' : 'Start falling'}
          </button>
          <button type='button' className={styles.button} onClick={() => setPaused(!paused)}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button type='button' className={styles.button} onClick={() => setSnowKey(snowKey + 1)}>
            Clear
          </button>
          <button type='button' className={styles.button} onClick={() => setOptions(defaultOptions)}>
            Reset options
          </button>
        </div>
        <Controls values={options} onChange={setOption}>
          <Controls.Group title='Amount'>
            <Controls.Slider name='density' label='Density (per 100×100px)' min={0} max={20} step={0.05} />
            <Controls.Slider name='maxFlakes' label='Max flakes' min={0} max={12000} step={50} />
          </Controls.Group>
          <Controls.Group title='Fall'>
            <Controls.Slider name='speed' label='Speed (px/s)' min={0} max={400} />
            <Controls.Slider name='speedVariation' label='Speed variation' min={0} max={1} step={0.05} />
          </Controls.Group>
          <Controls.Group title='Wind'>
            <Controls.Slider name='wind' label='Wind (px/s)' min={-200} max={200} />
            <Controls.Slider name='windVariation' label='Wind variation and sway' min={0} max={1} step={0.05} />
            <Controls.Toggle name='followPointer' label='Follow pointer'>
              <Controls.Slider name='pointerStrength' label='Pointer strength (× speed)' min={0} max={3} step={0.1} />
            </Controls.Toggle>
          </Controls.Group>
          <Controls.Group title='Look'>
            <Controls.Range name='size' label='Size (px)' min={0.5} max={20} step={0.5} />
            <Controls.Range name='opacity' label='Opacity' min={0} max={1} step={0.05} />
            <Controls.Color name='color' label='Color (near to far)' />
            <Controls.Toggle name='twinkle' label='Twinkle' />
          </Controls.Group>
          <Controls.Group title='Ground'>
            <Controls.Toggle name='stick' label='Stick'>
              <Controls.Range name='groundTime' label='Ground time (s)' min={0} max={30} step={0.5} />
            </Controls.Toggle>
            <Controls.Toggle name='melt' label='Melt' />
          </Controls.Group>
          <Controls.Group title='Behavior'>
            <Controls.Toggle name='prefill' label='Prefill (applies on clear)' />
            <Controls.Toggle name='respectReducedMotion' label='Respect reduced motion' />
          </Controls.Group>
        </Controls>
        <pre className={styles.snippet}>{snippet(options)}</pre>
      </aside>
    </main>
  );
};
