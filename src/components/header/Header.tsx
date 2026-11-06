'use client'

import SearchIcon from '@mui/icons-material/Search'

import { Account, Brand, ModeButton, Modes, Owner, Search, SearchField, Top } from './styles'

export type AppMode = 'inbox' | 'agent'

type Props = {
  owner: string
  mode: AppMode
  onMode: (mode: AppMode) => void
  query: string
  onQuery: (value: string) => void
}

export function Header({ owner, mode, onMode, query, onQuery }: Props) {
  return (
    <Top>
      <Brand>Lume</Brand>
      {mode === 'inbox' ? (
        <Search>
          <SearchIcon fontSize="small" />
          <SearchField
            value={query}
            placeholder="Search mail"
            aria-label="Search mail"
            onChange={event => onQuery(event.target.value)}
          />
        </Search>
      ) : (
        <span />
      )}
      <Account>
        <Modes role="group" aria-label="View">
          <ModeButton type="button" active={mode === 'inbox'} aria-pressed={mode === 'inbox'} onClick={() => onMode('inbox')}>
            Inbox
          </ModeButton>
          <ModeButton type="button" active={mode === 'agent'} aria-pressed={mode === 'agent'} onClick={() => onMode('agent')}>
            Agent
          </ModeButton>
        </Modes>
        <Owner>{owner}</Owner>
      </Account>
    </Top>
  )
}
