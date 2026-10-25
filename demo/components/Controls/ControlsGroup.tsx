import type { ReactNode } from 'react';
import styles from './ControlsGroup.module.scss';

type ControlsGroupProps = {
  title: string;
  children: ReactNode;
};

export const ControlsGroup = ({ title, children }: ControlsGroupProps) => (
  <fieldset className={styles.group}>
    <legend className={styles.title}>{title}</legend>
    {children}
  </fieldset>
);
