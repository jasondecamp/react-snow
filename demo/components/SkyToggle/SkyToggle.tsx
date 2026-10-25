import classNames from 'classnames';
import styles from './SkyToggle.module.scss';

type SkyToggleProps = {
  isDay: boolean;
  onChange: (isDay: boolean) => void;
};

// Switches the playground's backdrop between a night and a day sky, to check
// how flakes read on each. Not a snow option, so it sits apart from the controls.
export const SkyToggle = ({ isDay, onChange }: SkyToggleProps) => (
  <button
    type='button'
    role='switch'
    aria-checked={isDay}
    aria-label='Day sky'
    className={classNames(styles.skyToggle, isDay && styles.day)}
    onClick={() => onChange(!isDay)}
  >
    <svg className={classNames(styles.icon, styles.sun)} viewBox='2.25 2.25 19.5 19.5' aria-hidden='true'>
      <circle cx='12' cy='12' r='4' />
      <path d='M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1' />
    </svg>
    <svg className={classNames(styles.icon, styles.moon)} viewBox='3.72 1.59 18.78 18.78' aria-hidden='true'>
      <path d='M15 17.5A7 7 0 1 1 10 5a5.5 5.5 0 0 0 5 12.5Z' />
      <path d='M18 3l.8 2.2L21 6l-2.2.8L18 9l-.8-2.2L15 6l2.2-.8ZM20.5 11l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5Z' />
    </svg>
    <span className={styles.knob} />
  </button>
);
