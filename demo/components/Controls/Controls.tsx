import type { ReactNode } from 'react';
import { ControlsColor } from './ControlsColor';
import { ControlsContext } from './ControlsContext';
import type { ControlValue } from './ControlsContext';
import { ControlsGroup } from './ControlsGroup';
import { ControlsRange } from './ControlsRange';
import { ControlsSlider } from './ControlsSlider';
import { ControlsToggle } from './ControlsToggle';
import styles from './Controls.module.scss';

type ControlsProps = {
  values: Record<string, ControlValue>;
  onChange: (name: string, value: ControlValue) => void;
  children: ReactNode;
};

// A panel of labeled inputs bound by name to one values object.
//
//   <Controls values={options} onChange={setOption}>
//     <Controls.Group title='Fall'>
//       <Controls.Slider name='speed' label='Speed' min={0} max={300} />
//       <Controls.Toggle name='stick' label='Stick'>
//         <Controls.Range name='groundTime' label='Ground time' min={0} max={30} />
//       </Controls.Toggle>
//     </Controls.Group>
//   </Controls>
export const Controls = ({ values, onChange, children }: ControlsProps) => (
  <ControlsContext.Provider value={{ values, onChange }}>
    <form className={styles.controls} onSubmit={(event) => event.preventDefault()}>
      {children}
    </form>
  </ControlsContext.Provider>
);

Controls.Group = ControlsGroup;
Controls.Slider = ControlsSlider;
Controls.Range = ControlsRange;
Controls.Toggle = ControlsToggle;
Controls.Color = ControlsColor;
