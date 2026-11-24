import { createRoot } from 'react-dom/client';
import '../engine/comments.js';
import '../engine/prototype.js';
import { App } from './app';
import './styles.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Missing #root element');
}

createRoot(rootElement).render(<App />);
