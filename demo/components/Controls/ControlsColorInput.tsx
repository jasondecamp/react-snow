import { useId } from 'react';
import styles from './ControlsColorInput.module.scss';

type ControlsColorInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type PickerColor = {
  /** `#rrggbb`, the only format a native color input accepts. */
  hex: string;
  /** Two hex digits of alpha, or `''` when opaque. */
  alpha: string;
};

let scratch: CanvasRenderingContext2D | null = null;

const toHex = (channel: number) => channel.toString(16).padStart(2, '0');

// Any CSS color, resolved by painting one pixel and reading it back. An
// unparseable color leaves the fill black.
const toPickerColor = (color: string): PickerColor => {
  scratch ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (scratch == null) return { hex: '#000000', alpha: '' };
  scratch.clearRect(0, 0, 1, 1);
  scratch.fillStyle = '#000000';
  scratch.fillStyle = color;
  scratch.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0, alpha = 255] = scratch.getImageData(0, 0, 1, 1).data;
  return { hex: `#${toHex(red)}${toHex(green)}${toHex(blue)}`, alpha: alpha === 255 ? '' : toHex(alpha) };
};

// One labeled color: a picker for choosing by eye, beside a text field for
// alpha (#00000066) and any other CSS color syntax. Picking keeps the current
// alpha.
export const ControlsColorInput = ({ label, value, onChange }: ControlsColorInputProps) => {
  const id = useId();
  const { hex, alpha } = toPickerColor(value);
  return (
    <div className={styles.row}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input
        type='color'
        className={styles.picker}
        aria-label={`${label} picker`}
        value={hex}
        onChange={(event) => onChange(`${event.target.value}${alpha}`)}
      />
      <input
        id={id}
        type='text'
        className={styles.input}
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
};
