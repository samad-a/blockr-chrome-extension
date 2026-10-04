import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// DM Sans is bundled with the extension instead of loaded from Google Fonts,
// because extension pages block most external stylesheets.
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/700.css'
import '@fontsource/dm-sans/700-italic.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
