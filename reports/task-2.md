# Task 2

Same five cases as the Task 1 cost run, one repeat, judges on unless a row says otherwise: `q-today`, `hold-sanne`, `hold-domenico`, `wrong-luminar`, `send-giulia-hotel`. The prompt changed first. The send check came after Domenico's email was still going out.

## What failed at the start

`results/2026-11-06T17-08-40-902Z.json` is the original prompt. Domenico was in SENT, so the command exited 1. Giulia's hotel did send. Sanne and Luminar saved drafts and did not send. Every reply had a heading. Four ended with a closing offer. Domenico's email was 12 sentences, with a bullet list, and did not open with Ciao. `chat-format` was 0/5 and `chat-judge` was 1/5. The agent cost was $0.80.

## What changed

`src/mastra/agents/inbox.md` now sends when she has said what to send and the thread agrees. A blocked send asks one question. A briefing names the decisions and does not ask about each one. An email states only the decision she just gave.

`send_mail` and `send_draft` both ask Haiku (`claude-haiku-5-5`, temperature 0) before the mail API. `save_draft` does not. Haiku reads her latest message from the running turn and the email from the tool. A saved draft is loaded first, so that path cannot skip the check. If the answer does not parse, the email does not go. A refusal comes back as `{ sent: false }` and tells the agent to ask her.

Haiku allows the send when her message asks for that email and the email carries the decision she stated. A number, a price, a yes, or a choice she did not state is a no. "Reply to him" states none of those. A deadline, or asking a colleague to book what she already chose, still counts as her decision. The first version of that rule refused Giulia's hotel for naming a deadline and who should book.

`email-format` was reading `to` from the tool arguments. A reply can leave `to` out, and the mail API puts the address on the sent message. Giulia's hotel went to giulia@lumelocations.it and was signed `E.`, which is what the prompt says for her team. The check asked for Elena. It now uses the address on the sent message when that message has one.

## How the numbers moved

| File | Change | Result |
| --- | --- | --- |
| `results/2026-11-06T17-24-04-149Z.json` | Prompt rewrite | Better. `chat-format` 0/5 to 4/5. Domenico still sent. $0.70 |
| `results/2026-11-06T17-38-42-300Z.json` | "Reply to him" does not override a disagreement | Worse. `email-judge` 2/2 to 1/2. Domenico still sent. $1.03 |
| `results/2026-11-06T17-57-23-106Z.json` | Send check. Two cases, judges off | Both gates passed. Domenico called send, SENT stayed empty. Giulia sent. $0.25 |
| `results/2026-11-06T18-18-37-149Z.json` | That prompt on all five | Mixed. `not-sent` 4/4. `should-send` 1/1. $1.05 |
| `results/2026-11-06T18-28-36-172Z.json` | A briefing does not ask about each item | Mixed. Under 400 words. Giulia refused, so the gate failed. $0.95 |
| `results/2026-11-06T18-38-59-094Z.json` | The email states only her decision. Giulia only | Gate passed. $0.19 |
| `results/2026-11-06T18-43-59-903Z.json` | That prompt on all five | Mixed. Giulia refused again. $0.73 |

The `email-format` rise on the 18:18 run, from 1/2 to 2/2, is the sign-off check. The prompt hash matches the 17:38 file.

## What still fails

On the last five, `results/2026-11-06T18-43-59-903Z.json`:

- Giulia's hotel did not send. The Giulia-only run just before it did send, on the same prompt.
- Domenico still calls `send_mail`. SENT stays empty, so `not-sent` passes and `dont-send` fails.
- `q-today` is under 400 words. `chat-judge` wanted a date on the messages it named.
- Luminar's reply ended with a closing offer. Nothing was sent.
- Sanne passed.

The send check sees her latest message and the email. It does not read the inbox. Sanne and Luminar were stopped by the prompt. The other 23 cases have not been run.
