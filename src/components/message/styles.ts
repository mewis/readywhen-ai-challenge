'use client'

import { styled } from '@mui/material/styles'
import { motion } from 'framer-motion'

export const Pane = styled('section')(({ theme }) => ({
  minWidth: 0,
  minHeight: 0,
  marginLeft: 8,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '16px 0 0 0',
}))

export const PaneScroll = styled(motion.div)({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  padding: '20px 32px 48px',
})

export const PaneSubject = styled('h2')({
  margin: '0 48px 16px 0',
  fontSize: 22,
  fontWeight: 400,
})

export const PaneHead = styled('div')({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
})

export const Avatar = styled('span')(({ theme }) => ({
  width: 28,
  height: 28,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  flex: '0 0 auto',
  backgroundColor: '#d3e3fd',
  color: theme.palette.primary.main,
  fontSize: 13,
  fontWeight: 500,
}))

export const Who = styled('div')({
  minWidth: 0,
  flex: 1,
})

export const WhoName = styled('div')({
  fontSize: 14,
  fontWeight: 700,
})

export const WhoMeta = styled('div')(({ theme }) => ({
  marginTop: 2,
  fontSize: 12,
  color: theme.palette.text.secondary,
}))

export const ThreadList = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  marginTop: 8,
})

export const ThreadCard = styled('article', {
  shouldForwardProp: prop => prop !== 'current',
})<{ current?: boolean }>(({ current }) => ({
  borderRadius: 12,
  padding: '12px 4px',
  backgroundColor: current ? '#f6f8fc' : 'transparent',
}))

export const ThreadToggle = styled('button')({
  all: 'unset',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  cursor: 'pointer',
})

export const Snippet = styled('span')(({ theme }) => ({
  minWidth: 0,
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 13,
  color: theme.palette.text.secondary,
}))

export const Files = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
  marginTop: 16,
})

export const FileButton = styled('button')(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 12,
  padding: '8px 12px',
  cursor: 'pointer',
  font: 'inherit',
  textAlign: 'left',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  '&:hover': { backgroundColor: theme.palette.action.hover },
}))

export const FileName = styled('div')({
  fontSize: 13,
  fontWeight: 500,
})

export const FileMeta = styled('div')(({ theme }) => ({
  marginTop: 2,
  fontSize: 12,
  color: theme.palette.text.secondary,
}))

export const FileBody = styled('pre')(({ theme }) => ({
  width: '100%',
  boxSizing: 'border-box',
  margin: 0,
  padding: 12,
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  font: 'inherit',
  fontSize: 13,
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
}))

export const Body = styled('pre')(({ theme }) => ({
  margin: '28px 0 0',
  font: 'inherit',
  fontSize: 14,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  color: theme.palette.text.primary,
}))

export const ThreadBody = styled(Body)({
  marginTop: 16,
})

export const SendButton = styled('button')(({ theme }) => ({
  border: 0,
  borderRadius: 16,
  padding: '6px 16px',
  marginTop: 2,
  font: 'inherit',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  color: theme.palette.primary.contrastText,
  backgroundColor: theme.palette.primary.main,
  '&:hover': { backgroundColor: theme.palette.primary.dark },
  '&:disabled': { opacity: 0.45, cursor: 'default' },
}))

export const SendError = styled('p')(({ theme }) => ({
  margin: '8px 0 0',
  fontSize: 13,
  color: theme.palette.error.main,
}))

export const ControlRow = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 8,
})

export const ControlButton = styled('button', {
  shouldForwardProp: prop => prop !== 'on',
})<{ on?: boolean }>(({ theme, on }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 16,
  padding: '8px 16px',
  font: 'inherit',
  fontSize: 14,
  cursor: 'pointer',
  color: theme.palette.text.primary,
  backgroundColor: on ? theme.palette.action.selected : 'transparent',
  '&:hover': { backgroundColor: theme.palette.action.hover },
}))

export const Composer = styled('form')(({ theme }) => ({
  marginTop: 16,
  padding: 16,
  borderRadius: 16,
  border: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}))

export const ComposerField = styled('label')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontSize: 13,
})

export const ComposerLabel = styled('span')(({ theme }) => ({
  width: 64,
  flex: '0 0 auto',
  color: theme.palette.text.secondary,
}))

export const ComposerInput = styled('input')(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  border: 0,
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: '6px 0',
  font: 'inherit',
  fontSize: 14,
  color: theme.palette.text.primary,
  background: 'transparent',
  '&:focus': { outline: 'none', borderBottomColor: theme.palette.primary.main },
}))

export const ComposerBody = styled('textarea')(({ theme }) => ({
  minHeight: 140,
  resize: 'vertical',
  border: 0,
  padding: '8px 0',
  font: 'inherit',
  fontSize: 14,
  lineHeight: 1.5,
  color: theme.palette.text.primary,
  background: 'transparent',
  '&:focus': { outline: 'none' },
  '&::placeholder': { color: theme.palette.text.secondary },
}))

export const ComposerActions = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
})

export const QuietButton = styled('button')(({ theme }) => ({
  border: 0,
  borderRadius: 16,
  padding: '6px 12px',
  font: 'inherit',
  fontSize: 13,
  cursor: 'pointer',
  color: theme.palette.text.secondary,
  background: 'transparent',
  '&:hover': { backgroundColor: theme.palette.action.hover },
}))

export const ReplyButton = styled('button')(({ theme }) => ({
  border: 0,
  borderRadius: 16,
  padding: '6px 12px',
  marginTop: 2,
  font: 'inherit',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  color: theme.palette.primary.main,
  backgroundColor: theme.palette.action.selected,
  '&:disabled': { opacity: 0.45, cursor: 'default' },
}))

export const StarButton = styled('button', {
  shouldForwardProp: prop => prop !== 'on',
})<{ on?: boolean }>(({ on }) => ({
  width: 36,
  height: 36,
  border: 0,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  background: 'transparent',
  color: on ? '#f9ab00' : '#444746',
  '&:hover': { backgroundColor: 'rgba(32, 33, 36, 0.06)' },
}))

export const Empty = styled('div')(({ theme }) => ({
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  fontSize: 14,
}))

export const Status = styled('p')(({ theme }) => ({
  margin: 0,
  padding: 16,
  color: theme.palette.text.secondary,
  fontSize: 14,
}))
