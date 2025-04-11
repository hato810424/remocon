import '@mantine/core/styles.css'
import { AppShell, MantineProvider } from '@mantine/core'
import theme from './theme.ts'

export default function LayoutDefault({ children }) {
  return (
    <MantineProvider theme={theme}>
      <AppShell>
        <AppShell.Main>
          {children}
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}
