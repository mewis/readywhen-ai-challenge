# Task 3

## Aim

The aim of the product is to help Elena tackle her day to day, and see which tasks need urgent action.

## What I added

As well as the usual mailbox tools, I have added:

- A reply that uses the agent. Write my response, on the message and on its row, asks the agent to save a draft in that thread and not to send it. A draft has Send.
- A section where the agent decides the top priorities. When she asks what needs her, what she should reply to, or what is waiting on a decision, it labels the ones that need her today and takes the label off anything that can wait. Those messages load in the main list like any other folder.
- A chat bot with recommendations on getting started. It sits in the bottom right and can collapse to a button. The opening prompts are what she has today, what she should reply to, what is waiting on a decision, and whether anything looks wrong.
- A split UI, so she can work in the mailbox or focus purely on the agent. Inbox and Agent in the header use the same conversation. Agent is the chat on its own.

## The usual tools

The usual tools are the folders, search, threads, and attachments. Reply, Reply all, and Forward sit under the open message, and she types those herself. Opening a message marks it read. There is also a New test mailbox control at the bottom of the sidebar, marked as for testing only. It loads a fresh copy of her inbox for that session.

## Evals

If I had more time, I would add evals for the new lines in the prompt. One is the draft reply, which should be saved and not sent, and should not be written at all when she has not decided or a reply is blocked. The other is priority, which should only be what needs her today, with the label taken off the rest. The cases from Task 2 do not cover either of those.

## What I would want to learn

What I would want to learn is whether those priorities are meaningful to her, and how she would want to engage with them. That might be in the mailbox, as a checklist, or as far as a daily kanban board.

I would also want to see how much the agent is trusted to do the work. Whether processing all of the tasks in one go would be feasible, and how they engage with it: as a usual mailbox, or agent first.
