'use client'

import { styled } from '@mui/material/styles'
import { motion } from 'framer-motion'

export const Shell = styled('div')(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
}))

export const Workspace = styled('div')({
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: '256px minmax(360px, 420px) 1fr',
})

export const PriorityEmpty = styled('button')(({ theme }) => ({
  border: 0,
  borderRadius: 16,
  padding: '8px 16px',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 14,
  color: theme.palette.primary.main,
  background: 'transparent',
  '&:hover': { backgroundColor: theme.palette.action.hover },
  '&:disabled': { opacity: 0.45, cursor: 'default' },
}))

export const Side = styled('aside')({
  minHeight: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
})

export const Nav = styled('nav')({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  padding: '8px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
})

export const DevSlot = styled('div')(({ theme }) => ({
  padding: '12px 16px 20px',
  borderTop: `1px solid ${theme.palette.divider}`,
}))

export const DevButton = styled('button')(({ theme }) => ({
  width: '100%',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 16,
  padding: '8px 12px',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 13,
  fontWeight: 500,
  textAlign: 'left',
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.background.paper,
  '&:hover': { backgroundColor: theme.palette.action.hover },
  '&:disabled': { opacity: 0.45, cursor: 'default' },
}))

export const DevNote = styled('p')(({ theme }) => ({
  margin: '8px 4px 0',
  fontSize: 12,
  lineHeight: 1.4,
  color: theme.palette.text.secondary,
}))

export const NavButton = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active?: boolean }>(({ theme, active }) => ({
  position: 'relative',
  height: 32,
  border: 0,
  borderRadius: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '0 12px 0 16px',
  cursor: 'pointer',
  textAlign: 'left',
  font: 'inherit',
  fontSize: 14,
  fontWeight: active ? 700 : 500,
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  background: 'transparent',
}))

export const FolderPill = styled(motion.span)(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  borderRadius: 16,
  backgroundColor: theme.palette.action.selected,
  zIndex: 0,
}))

export const NavLabel = styled('span')({
  position: 'relative',
  zIndex: 1,
  flex: 1,
})

export const NavIcon = styled('span')({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
})

export const Count = styled('span')({
  position: 'relative',
  zIndex: 1,
  fontSize: 12,
  fontWeight: 700,
})

export const ListColumn = styled('section')(({ theme }) => ({
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '16px 16px 0 0',
}))

export const ListHeading = styled('h1')({
  margin: 0,
  padding: '16px 16px 8px',
  fontSize: 22,
  fontWeight: 400,
})

export const ListScroll = styled('div')({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
})

export const List = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  padding: '0 8px 16px',
})

export const Row = styled('div', {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
  display: 'flex',
  alignItems: 'center',
  borderRadius: 16,
  backgroundColor: selected ? theme.palette.action.selected : 'transparent',
  '&:hover': {
    backgroundColor: selected ? theme.palette.action.selected : theme.palette.action.hover,
  },
}))

export const Open = styled('button', {
  shouldForwardProp: prop => prop !== 'unread',
})<{ unread?: boolean }>(({ theme, unread }) => ({
  all: 'unset',
  flex: 1,
  minWidth: 0,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  paddingLeft: 8,
  cursor: 'pointer',
  fontWeight: unread ? 700 : 400,
  color: theme.palette.text.primary,
}))

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

export const RowText = styled('span')({
  minWidth: 0,
  flex: 1,
  display: 'flex',
  gap: 8,
})

export const From = styled('span')({
  width: 148,
  flex: '0 0 auto',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 14,
})

export const SubjectLine = styled('span')(({ theme }) => ({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 14,
  color: theme.palette.text.secondary,
}))

export const Subject = styled('span')(({ theme }) => ({
  color: theme.palette.text.primary,
}))

export const When = styled('span')(({ theme }) => ({
  flex: '0 0 auto',
  paddingRight: 8,
  fontSize: 12,
  fontWeight: 400,
  color: theme.palette.text.secondary,
}))

export const IconButton = styled('button')(({ theme }) => ({
  width: 36,
  height: 36,
  border: 0,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  background: 'transparent',
  color: theme.palette.text.secondary,
  '&:hover': { backgroundColor: 'rgba(32, 33, 36, 0.06)' },
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
