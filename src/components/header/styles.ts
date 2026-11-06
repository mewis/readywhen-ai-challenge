'use client'

import { styled } from '@mui/material/styles'

export const Top = styled('header')(({ theme }) => ({
  height: 64,
  display: 'grid',
  gridTemplateColumns: '220px 1fr auto',
  alignItems: 'center',
  gap: 12,
  padding: '0 16px',
  backgroundColor: theme.palette.background.default,
}))

export const Brand = styled('div')(({ theme }) => ({
  fontSize: 22,
  fontWeight: 500,
  color: theme.palette.text.secondary,
}))

export const Search = styled('label')(({ theme }) => ({
  height: 48,
  maxWidth: 720,
  width: '100%',
  justifySelf: 'center',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '0 16px',
  borderRadius: 24,
  backgroundColor: '#eaf1fb',
  color: theme.palette.text.secondary,
  '&:focus-within': {
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0 1px 3px rgba(60, 64, 67, 0.2)',
  },
}))

export const SearchField = styled('input')(({ theme }) => ({
  flex: 1,
  border: 0,
  outline: 0,
  background: 'transparent',
  font: 'inherit',
  fontSize: 16,
  color: theme.palette.text.primary,
}))

export const Account = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
})

export const Modes = styled('div')({
  display: 'flex',
  padding: 3,
  borderRadius: 20,
  backgroundColor: '#eaf1fb',
})

export const ModeButton = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active?: boolean }>(({ theme, active }) => ({
  border: 0,
  borderRadius: 16,
  padding: '6px 14px',
  font: 'inherit',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: active ? theme.palette.background.paper : 'transparent',
  boxShadow: active ? '0 1px 2px rgba(60, 64, 67, 0.18)' : 'none',
}))

export const Owner = styled('div')(({ theme }) => ({
  fontSize: 13,
  color: theme.palette.text.secondary,
}))
