import { useId } from 'react';
import type { ReactNode } from 'react';
import { ControlsChoiceContext } from './ControlsChoiceContext';
import styles from './ControlsChoice.module.scss';

type ControlsChoiceProps = {
  name: string;
  label: string;
  /** Controls.ChoiceOption elements, one per value. */
  children: ReactNode;
};

// One value out of a few, as a row of segmented radio buttons.
//
//   <Controls.Choice name='flake' label='Flake'>
//     <Controls.ChoiceOption value='dot' label='Dot' />
//     <Controls.ChoiceOption value={crystal} label='Crystal' />
//   </Controls.Choice>
export const ControlsChoice = ({ name, label, children }: ControlsChoiceProps) => {
  const id = useId();
  return (
    <ControlsChoiceContext.Provider value={{ name }}>
      <div className={styles.choice} role='radiogroup' aria-labelledby={id}>
        <span id={id}>{label}</span>
        <div className={styles.options}>{children}</div>
      </div>
    </ControlsChoiceContext.Provider>
  );
};
