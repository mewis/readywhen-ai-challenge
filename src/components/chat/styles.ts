'use client'

import { styled } from '@mui/material/styles'
import { motion } from 'framer-motion'

export const Dock = styled(motion.aside)(({ theme }) => ({
  position: 'fixed',
  right: 24,
  bottom: 24,
  width: 380,
  height: 520,
  zIndex: 20,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: 16,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 8px 28px rgba(60, 64, 67, 0.28)',
}))

export const Stage = styled('div')({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  justifyContent: 'center',
})

export const Panel = styled('section')({
  flex: 1,
  minHeight: 0,
  width: '100%',
  maxWidth: 760,
  display: 'flex',
  flexDirection: 'column',
})

export const TitleBar = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 8px 0 16px',
})

export const PanelTitle = styled('div')(({ theme }) => ({
  fontSize: 14,
  fontWeight: 500,
  color: theme.palette.text.secondary,
}))

export const Close = styled('button')(({ theme }) => ({
  width: 36,
  height: 36,
  border: 0,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  color: theme.palette.text.secondary,
  background: 'transparent',
  '&:hover': { backgroundColor: theme.palette.action.hover },
}))

export const Fab = styled(motion.button)(({ theme }) => ({
  position: 'fixed',
  right: 24,
  bottom: 24,
  zIndex: 20,
  width: 56,
  height: 56,
  border: 0,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  color: theme.palette.background.paper,
  backgroundColor: theme.palette.primary.main,
  boxShadow: '0 6px 16px rgba(11, 87, 208, 0.35)',
}))

export const EmptyState = styled('div')({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 16,
  padding: '8px 0',
})

export const Transcript = styled('div')({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '8px 16px 12px',
})

export const Turn = styled(motion.div, {
  shouldForwardProp: prop => prop !== 'mine',
})<{ mine?: boolean }>(({ mine }) => ({
  display: 'flex',
  justifyContent: mine ? 'flex-end' : 'flex-start',
}))

export const Bubble = styled('div', {
  shouldForwardProp: prop => prop !== 'mine',
})<{ mine?: boolean }>(({ theme, mine }) => ({
  maxWidth: '88%',
  padding: '10px 12px',
  borderRadius: 16,
  whiteSpace: 'pre-wrap',
  fontSize: 14,
  lineHeight: 1.5,
  color: theme.palette.text.primary,
  backgroundColor: mine ? theme.palette.action.selected : '#f2f6fc',
}))

export const Ideas = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  padding: '4px 16px 8px',
})

export const Idea = styled('button')(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 16,
  padding: '8px 12px',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.primary.main,
  font: 'inherit',
  fontSize: 13,
  textAlign: 'left',
  cursor: 'pointer',
  '&:hover': { backgroundColor: theme.palette.action.hover },
}))

export const Composer = styled('form')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 8,
  padding: 12,
  borderTop: `1px solid ${theme.palette.divider}`,
}))

export const Field = styled('textarea')(({ theme }) => ({
  flex: 1,
  resize: 'none',
  border: 0,
  outline: 0,
  maxHeight: 120,
  padding: '8px 4px',
  background: 'transparent',
  font: 'inherit',
  fontSize: 14,
  lineHeight: 1.4,
  color: theme.palette.text.primary,
}))

export const Send = styled('button')(({ theme }) => ({
  border: 0,
  borderRadius: 16,
  padding: '8px 14px',
  font: 'inherit',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  color: theme.palette.background.paper,
  backgroundColor: theme.palette.primary.main,
  '&:disabled': { opacity: 0.45, cursor: 'default' },
}))

export const Note = styled('p')(({ theme }) => ({
  margin: 0,
  padding: '0 16px 8px',
  fontSize: 13,
  color: theme.palette.text.secondary,
}))
