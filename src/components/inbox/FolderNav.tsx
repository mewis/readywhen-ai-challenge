'use client'

import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined'
import type { ReactNode } from 'react'

import { Count, FolderPill, Nav, NavButton, NavIcon, NavLabel } from './styles'

export type FolderItem = { id: string; label: string; count: number | null }

const ICONS: Record<string, ReactNode> = {
  PRIORITY: <FlagOutlinedIcon fontSize="small" />,
  INBOX: <InboxOutlinedIcon fontSize="small" />,
  STARRED: <StarBorderOutlinedIcon fontSize="small" />,
  SENT: <SendOutlinedIcon fontSize="small" />,
  DRAFT: <DraftsOutlinedIcon fontSize="small" />,
}

type Props = {
  folders: FolderItem[]
  selected: string
  onSelect: (id: string) => void
}

export function FolderNav({ folders, selected, onSelect }: Props) {
  return (
    <Nav aria-label="Folders">
      {folders.map(folder => {
        const active = folder.id === selected
        return (
          <NavButton key={folder.id} type="button" active={active} aria-current={active ? 'page' : undefined} onClick={() => onSelect(folder.id)}>
            {active ? <FolderPill layoutId="folder-pill" /> : null}
            <NavIcon>{ICONS[folder.id]}</NavIcon>
            <NavLabel>{folder.label}</NavLabel>
            {folder.count ? <Count>{folder.count}</Count> : null}
          </NavButton>
        )
      })}
    </Nav>
  )
}
