export const FOLDERS = [
  { id: 'PRIORITY', label: 'Priority' },
  { id: 'INBOX', label: 'Inbox' },
  { id: 'STARRED', label: 'Starred' },
  { id: 'SENT', label: 'Sent' },
  { id: 'DRAFT', label: 'Drafts' },
] as const

export type FolderId = (typeof FOLDERS)[number]['id']

export function folderLabel(id: string): string {
  return FOLDERS.find(folder => folder.id === id)?.label ?? 'Mail'
}
