import classNames from 'classnames';
import { useId } from 'react';
import type { Range } from 'react-snow';
import { useControls } from './ControlsContext';
import styles from './ControlsRange.module.scss';

type ControlsRangeProps = {
  name: string;
  label: string;
  min: number;
  max: number;
  step?: number;
};

// A [min, max] pair as one slider with two thumbs: two range inputs stacked on
// one track, so each thumb keeps native keyboard and screen reader support.
export const ControlsRange = ({ name, label, min, max, step = 1 }: ControlsRangeProps) => {
  const { values, onChange } = useControls();
  const id = useId();
  const [low, high] = (values[name] as Range | undefined) ?? [min, max];
  const percent = (value: number) => ((value - min) / (max - min)) * 100;
  // When the thumbs meet, the one on top must be able to move away from the
  // other: the low thumb near the top of the range, the high one near the bottom.
  const lowOnTop = low > (min + max) / 2;
  return (
    <div className={styles.range}>
      <div className={styles.header}>
        <span id={id}>{label}</span>
        <output className={styles.value}>{low} – {high}</output>
      </div>
      <div className={styles.track}>
        <div className={styles.fillArea}>
          <div
            className={styles.fill}
            style={{ left: `${percent(low)}%`, width: `${percent(high) - percent(low)}%` }}
          />
        </div>
        <input
          type='range'
          className={classNames(styles.input, lowOnTop && styles.onTop)}
          aria-label={`${label} minimum`}
          aria-describedby={id}
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(event) => onChange(name, [Math.min(Number(event.target.value), high), high])}
        />
        <input
          type='range'
          className={classNames(styles.input, !lowOnTop && styles.onTop)}
          aria-label={`${label} maximum`}
          aria-describedby={id}
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(event) => onChange(name, [low, Math.max(Number(event.target.value), low)])}
        />
      </div>
    </div>
  );
};
