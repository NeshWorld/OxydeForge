import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyTextScale } from './settings';
import './styles.css';

applyTextScale();

createRoot(document.getElementById('root')!).render(<App />);
