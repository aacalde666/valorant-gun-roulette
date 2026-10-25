import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import OverlayApp from './OverlayApp.jsx'

const isOverlayView = window.location.hash === '#overlay'

if (isOverlayView) {
  // Ensure transparent background for Electron overlay window
  document.documentElement.style.backgroundColor = 'transparent';
  document.documentElement.style.background = 'transparent';
  document.body.style.backgroundColor = 'transparent';
  document.body.style.background = 'transparent';
  document.documentElement.classList.add('bg-transparent');
  document.body.classList.remove('bg-[#090e13]', 'bg-[#0b1117]');
  document.body.classList.add('bg-transparent');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isOverlayView ? <OverlayApp /> : <App />}
  </StrictMode>,
)
