import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../shared/fonts'
import '../shared/theme.css'
import BlockedApp from './BlockedApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BlockedApp />
  </StrictMode>,
)
