import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App/App';
import './styles/global.scss';

const root = document.getElementById('root');
if (root != null) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
