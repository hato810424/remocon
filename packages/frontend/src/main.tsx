import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css'
import { AppShell, MantineProvider } from '@mantine/core'
import theme from './theme.ts'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <AppShell>
        <AppShell.Main>
          <App />
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  </StrictMode>,
)
