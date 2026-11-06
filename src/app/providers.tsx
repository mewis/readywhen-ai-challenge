'use client'

import type { ReactNode } from 'react'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

const theme = createTheme({
  palette: {
    background: { default: '#f6f8fc', paper: '#ffffff' },
    divider: '#e0e3e7',
    text: { primary: '#1f1f1f', secondary: '#444746' },
    primary: { main: '#0b57d0' },
    action: { hover: '#f2f6fc', selected: '#d3e3fd' },
  },
  typography: { fontFamily: 'Roboto, Helvetica, Arial, sans-serif' },
  shape: { borderRadius: 16 },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
