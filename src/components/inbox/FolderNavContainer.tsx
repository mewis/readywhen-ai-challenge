'use client'

import { useLabels } from '@/hooks/useLabels'
import { FOLDERS, type FolderId } from '@/ui/folders'

import { DevMailbox } from './DevMailbox'
import { FolderNav } from './FolderNav'
import { Side } from './styles'

type Props = {
  folder: FolderId
  tick: number
  onSelect: (id: FolderId) => void
  onNewMailbox: (id: string) => void
}

export function FolderNavContainer({ folder, tick, onSelect, onNewMailbox }: Props) {
  const { labels } = useLabels(tick)
  const folders = FOLDERS.map(item => {
    const match = labels.find(label => label.name === item.id)
    const count = item.id === 'DRAFT' || item.id === 'PRIORITY' ? match?.total ?? 0 : match?.unread ?? 0
    return { id: item.id, label: item.label, count: count > 0 ? count : null }
  })

  return (
    <Side>
      <FolderNav folders={folders} selected={folder} onSelect={id => onSelect(id as FolderId)} />
      <DevMailbox onCreated={onNewMailbox} />
    </Side>
  )
}
