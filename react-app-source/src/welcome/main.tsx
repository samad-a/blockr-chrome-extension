import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../shared/fonts'
import '../shared/theme.css'
import WelcomeApp from './WelcomeApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WelcomeApp />
  </StrictMode>,
)
