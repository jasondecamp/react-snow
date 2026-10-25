import { useId } from 'react';
import type { ColorRange } from 'react-snow';
import { ControlsColorInput } from './ControlsColorInput';
import { useControls } from './ControlsContext';
import styles from './ControlsColor.module.scss';

type ControlsColorProps = {
  name: string;
  label: string;
};

// A color option as a near/far pair. Matching colors collapse back to a single
// string, so the snippet stays as short as the setting.
export const ControlsColor = ({ name, label }: ControlsColorProps) => {
  const { values, onChange } = useControls();
  const id = useId();
  const value = values[name];
  const [near, far] = Array.isArray(value) ? (value as ColorRange) : [String(value ?? ''), String(value ?? '')];
  const change = (nextNear: string, nextFar: string) => onChange(name, nextNear === nextFar ? nextNear : [nextNear, nextFar]);
  return (
    <div className={styles.color} role='group' aria-labelledby={id}>
      <span id={id}>{label}</span>
      <ControlsColorInput label='Near' value={near} onChange={(next) => change(next, far)} />
      <ControlsColorInput label='Far' value={far} onChange={(next) => change(near, next)} />
    </div>
  );
};
