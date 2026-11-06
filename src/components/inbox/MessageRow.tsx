'use client'

import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'

import { formatWhen, hasLabel, initial, person, type MessageSummary } from '@/ui/mail'

import { Avatar, From, IconButton, Open, Row, RowText, StarButton, Subject, SubjectLine, When } from './styles'

type Props = {
  message: MessageSummary
  selected: boolean
  replying: boolean
  onOpen: () => void
  onStar: () => void
  onReply: () => void
}

export function MessageRow({ message, selected, replying, onOpen, onStar, onReply }: Props) {
  const unread = hasLabel(message.labels, 'UNREAD')
  const starred = hasLabel(message.labels, 'STARRED')
  const name = person(message.from)
  const canReply = !hasLabel(message.labels, 'DRAFT')

  return (
    <Row selected={selected}>
      <StarButton
        type="button"
        on={starred}
        aria-label={starred ? `Remove star from ${name}` : `Star ${name}`}
        onClick={event => {
          event.stopPropagation()
          onStar()
        }}
      >
        {starred ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
      </StarButton>
      {canReply ? (
        <IconButton
          type="button"
          aria-label={`Write my response to ${name}`}
          disabled={replying}
          onClick={event => {
            event.stopPropagation()
            onReply()
          }}
        >
          <ReplyOutlinedIcon fontSize="small" />
        </IconButton>
      ) : null}
      <Open type="button" unread={unread} aria-current={selected ? 'true' : undefined} onClick={onOpen}>
        <Avatar>{initial(name)}</Avatar>
        <RowText>
          <From>{name}</From>
          <SubjectLine>
            <Subject>{message.subject || '(no subject)'}</Subject>
            {message.snippet ? ` ${message.snippet}` : ''}
          </SubjectLine>
        </RowText>
        <When>{formatWhen(message.date)}</When>
      </Open>
    </Row>
  )
}
