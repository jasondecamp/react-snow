import { useId } from 'react';
import { useControls } from './ControlsContext';
import styles from './ControlsSlider.module.scss';

type ControlsSliderProps = {
  name: string;
  label: string;
  min: number;
  max: number;
  step?: number;
};

export const ControlsSlider = ({ name, label, min, max, step = 1 }: ControlsSliderProps) => {
  const { values, onChange } = useControls();
  const id = useId();
  const value = Number(values[name] ?? min);
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className={styles.slider}>
      <div className={styles.header}>
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className={styles.value}>{value}</output>
      </div>
      <div className={styles.track}>
        <div className={styles.fillArea}>
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
        <input
          id={id}
          type='range'
          className={styles.input}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(name, Number(event.target.value))}
        />
      </div>
    </div>
  );
};
