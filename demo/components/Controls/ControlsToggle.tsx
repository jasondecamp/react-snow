import type { ReactNode } from 'react';
import { useControls } from './ControlsContext';
import styles from './ControlsToggle.module.scss';

type ControlsToggleProps = {
  name: string;
  label: string;
  /** Controls that only matter while the toggle is on. Hidden while it's off. */
  children?: ReactNode;
};

// A checkbox styled as a switch; role='switch' announces it as on/off.
export const ControlsToggle = ({ name, label, children }: ControlsToggleProps) => {
  const { values, onChange } = useControls();
  const checked = values[name] === true;
  return (
    <div className={styles.toggle}>
      <label className={styles.row}>
        {label}
        <input
          type='checkbox'
          role='switch'
          className={styles.input}
          checked={checked}
          onChange={(event) => onChange(name, event.target.checked)}
        />
      </label>
      {checked && children}
    </div>
  );
};
