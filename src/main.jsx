import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css'
import {MantineProvider} from '@mantine/core'
// NOTE: the Vite template's ./index.css is intentionally NOT imported here — its
// #root width/border/text-align rules fight the Mantine layout. Mantine's own
// styles.css provides the baseline. (Temporary preview harness — C's scaffold replaces this.)
import GamePage from './features/game/pages/GamePage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider>
      <GamePage />
    </MantineProvider>
  </StrictMode>,
)
