import { createContext, useContext } from 'react';

// The option name a Controls.Choice binds its options to. The default leaves
// an option standalone and inert.
export const ControlsChoiceContext = createContext({ name: '' });

export const useControlsChoice = () => useContext(ControlsChoiceContext);
