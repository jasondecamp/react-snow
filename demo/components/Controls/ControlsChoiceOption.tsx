import { useControlsChoice } from './ControlsChoiceContext';
import { useControls } from './ControlsContext';
import type { ControlValue } from './ControlsContext';
import styles from './ControlsChoiceOption.module.scss';

type ControlsChoiceOptionProps = {
  /** Compared by identity, so object values must be stable (module constants). */
  value: ControlValue;
  label: string;
};

export const ControlsChoiceOption = ({ value, label }: ControlsChoiceOptionProps) => {
  const { values, onChange } = useControls();
  const { name } = useControlsChoice();
  return (
    <label className={styles.option}>
      <input
        type='radio'
        className={styles.input}
        name={name}
        checked={values[name] === value}
        onChange={() => onChange(name, value)}
      />
      {label}
    </label>
  );
};
