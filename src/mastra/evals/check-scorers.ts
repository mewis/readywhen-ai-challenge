// Fixed replies for the scorers. No model and no mail API.
// `npm run check-scorers`
import type { MastraDBMessage } from '@mastra/core/agent'

import { parseArgs } from './args'
import { compare, type EvalResult } from './result'
import { asksOneQuestion } from '../scorers/asks-one-question'
import { chatFormat } from '../scorers/chat-format'
import { emailFormat } from '../scorers/email-format'
import { shouldSend } from '../scorers/should-send'

type Run = { output: MastraDBMessage[]; groundTruth?: unknown }

const DOMENICO = 'domenico@saporemobile.example'
const GIULIA = 'giulia@lumelocations.it'
const PRIYA = 'priya@harlowpine.example'
const SANNE = 'sanne.dewit@vandermeer-outdoor.example'
const ENRICO = 'enrico@studio.example'

let failed = 0

function check(label: string, ok: boolean, detail = '') {
  if (!ok) {
    failed += 1
    console.error(`fail  ${label}${detail ? `  ${detail}` : ''}`)
    return
  }
  console.log(`ok  ${label}`)
}

function reply(text: string, groundTruth?: unknown): Run {
  return { output: [{ id: 'm', role: 'assistant', createdAt: new Date(), content: text }] as unknown as MastraDBMessage[], groundTruth }
}

function send(messages: { to: string[]; cc?: string[]; body?: string }[], text = '', groundTruth?: unknown, delivered = true): Run {
  return {
    output: [{
      id: 'm',
      role: 'assistant',
      createdAt: new Date(),
      content: {
        content: text,
        toolInvocations: messages.map((message, index) => ({
          toolCallId: `c${index}`,
          toolName: 'send_mail',
          args: message,
          result: delivered
            ? {
                to: message.to.filter(email => email.includes('@')).map(email => ({ email })),
                cc: (message.cc ?? []).filter(email => email.includes('@')).map(email => ({ email })),
                body: message.body,
              }
            : { id: 'msg_sent' },
          state: 'output-available',
        })),
      },
    }] as unknown as MastraDBMessage[],
    groundTruth,
  }
}

function toDomenico(messages: { to: string[]; cc?: string[]; body?: string }[], text = '') {
  return send(messages, text, { shouldSend: true, to: DOMENICO })
}

async function main() {
  const offer = await chatFormat.run(reply('Would you like me to archive these newsletters for you?'))
  check('closing offer fails', offer.score === 0 && offer.reason === 'Closing offer.', String(offer.reason))

  const filler = await chatFormat.run(reply("Great question! I took a look through your inbox and here's what I found."))
  check('filler and exclamation fail', filler.score === 0 && String(filler.reason).includes('Filler opener.') && String(filler.reason).includes('Exclamation mark.'), String(filler.reason))

  const headed = await chatFormat.run(reply('## Summary\n\n- Status: The catering supplier has been contacted regarding headcount confirmation.'))
  check('heading and a short bullet list fail', headed.score === 0 && String(headed.reason).includes('Heading.') && String(headed.reason).includes('Bullet list in a short reply.'), String(headed.reason))

  const longBullet = await chatFormat.run(reply('Marta moved the call to 07:30. Giulia sent the new call sheet. The hotel is still open. The remaining items are:\n- the budget'))
  check('a bullet list in a longer reply passes', longBullet.score === 1, String(longBullet.reason))

  const loud = await chatFormat.run(reply('Here is a great, professional draft for you!'))
  check('an exclamation mark fails', loud.score === 0 && String(loud.reason).includes('Exclamation mark.'), String(loud.reason))

  const emoji = await chatFormat.run(reply('Archived the newsletters.'))
  const withEmoji = await chatFormat.run(reply('Archived the newsletters \u{1F44D}.'))
  check('emoji fails', emoji.score === 1 && withEmoji.score === 0, String(withEmoji.reason))

  const self = await chatFormat.run(reply('I am an AI and I archived them.'))
  check('calling itself an AI fails', self.score === 0 && String(self.reason).includes('Calls itself an AI, a model, a bot or a tool.'), String(self.reason))

  const hype = await chatFormat.run(reply('This will leverage the inbox.'))
  check('a hype word fails', hype.score === 0 && hype.reason === 'Hype word.', String(hype.reason))

  const dash = await chatFormat.run(reply('The range is 10—12. I left it.'))
  check('an em dash fails', dash.score === 0 && dash.reason === 'Em dash.', String(dash.reason))

  const hyphen = await chatFormat.run(reply('The range is 10--12. I left it.'))
  check('a double hyphen passes', hyphen.score === 1, String(hyphen.reason))

  const quoted = await chatFormat.run(reply('Priya wrote "We need it now!" and I left it.'))
  check('an exclamation inside quotes passes', quoted.score === 1, String(quoted.reason))

  const ids = await chatFormat.run(reply('See msg_0001 and thr_0004.'))
  check('an internal id fails', ids.score === 0 && ids.reason === 'Internal id.', String(ids.reason))

  const quotedId = await chatFormat.run(reply('Priya quoted "see msg_0001" this morning. I left it.'))
  check('an id inside quotes passes', quotedId.score === 1, String(quotedId.reason))

  const quotedLine = await chatFormat.run(reply('Priya forwarded this:\n> See msg_0001\nI left it.'))
  check('an id on a quoted line passes', quotedLine.score === 1, String(quotedLine.reason))

  const plain = await chatFormat.run(reply('Three things need you today: the budget, the hotel and the renewal.'))
  check('a plain reply passes', plain.score === 1, String(plain.reason))

  const long = await chatFormat.run(reply(`# Today\n\n${'word '.repeat(850)}Would you like me to draft any replies?`))
  check('a long headed reply fails', long.score === 0 && String(long.reason).includes('Longer than 400 words.') && String(long.reason).includes('Heading.') && String(long.reason).includes('Closing offer.'), String(long.reason))

  const unclear = { shouldSend: false, unclear: true }
  const none = await asksOneQuestion.run(reply('Nothing is waiting.', unclear))
  check('asking nothing fails', none.score === 0 && none.reason === 'Asked nothing.' && hits(none).includes('Asked nothing.'), String(none.reason))

  const onlyOffer = await asksOneQuestion.run(reply('Would you like me to draft a reply?', unclear))
  check('a closing offer is not the question', onlyOffer.score === 0 && onlyOffer.reason === 'The only question was a closing offer.', String(onlyOffer.reason))

  const one = await asksOneQuestion.run(reply('Giulia now says 21, and you said 42. Which number should I send?', unclear))
  check('one real question passes', one.score === 1 && hits(one).length === 0, String(one.reason))

  const two = await asksOneQuestion.run(reply('Which number? And who should I copy?', unclear))
  check('two questions fail', two.score === 0 && two.reason === 'Asked 2 questions.', String(two.reason))

  const menu = await asksOneQuestion.run(reply('Which should I do? I could reply, draft a response, or forward it to Giulia.', unclear))
  check('a menu with one question mark passes here', menu.score === 1, String(menu.reason))

  const sentInstead = await asksOneQuestion.run(send([{ to: [DOMENICO] }], 'Which number?', unclear))
  check('sending instead of asking fails', sentInstead.score === 0 && sentInstead.reason === 'Sent an email instead of asking.', String(sentInstead.reason))

  const hold = await asksOneQuestion.run(reply('Nothing from Sanne.', { shouldSend: false }))
  check('a hold case is not scored', hold.score === undefined, JSON.stringify(hold))

  const right = await shouldSend.run(toDomenico([{ to: [DOMENICO], cc: [GIULIA] }]))
  check('a team address in CC passes', right.score === 1, String(right.reason))

  const outsider = await shouldSend.run(toDomenico([{ to: [DOMENICO], cc: [PRIYA] }]))
  check('an outside address fails', outsider.score === 0 && outsider.reason === `Went to ${PRIYA}.`, String(outsider.reason))

  const name = await shouldSend.run(send([{ to: [DOMENICO, 'Priya Nair'] }], '', { shouldSend: true, to: DOMENICO }, false))
  check('a name with no email address is not an outsider', name.score === 1, String(name.reason))

  const missing = await shouldSend.run(toDomenico([{ to: [GIULIA] }]))
  check('the labelled person must be in To', missing.score === 0 && String(missing.reason).includes(`Did not include ${DOMENICO} in To.`), String(missing.reason))

  const twice = await shouldSend.run(toDomenico([{ to: [DOMENICO] }, { to: [DOMENICO] }]))
  check('two emails fail', twice.score === 0 && String(twice.reason).startsWith('Sent 2 emails.'), String(twice.reason))

  const stiff = "Dear Enrico, I hope this email finds you well. I am writing to confirm that our team will arrive at the studio at 7:00 tomorrow morning."
  const badEmail = await emailFormat.run(send([{ to: [ENRICO], body: stiff }]))
  check('a stiff email fails', badEmail.score === 0 && String(badEmail.reason).includes('send_mail does not open with Ciao.') && String(badEmail.reason).includes('send_mail uses corporate phrasing.'), String(badEmail.reason))

  const warm = await emailFormat.run(send([{ to: [ENRICO], body: "Ciao Enrico, we'll be at the studio from 07:00 tomorrow. Grazie, Elena" }]))
  check('a short email as Elena passes', warm.score === 1, String(warm.reason))

  const team = await emailFormat.run(send([{ to: [GIULIA], body: 'Ciao Giulia, the hotel is option A. E.' }]))
  check('a note to the team signs E.', team.score === 1, String(team.reason))

  const signedFull = await emailFormat.run(send([{ to: [GIULIA], body: 'Ciao Giulia, the hotel is option A. Elena' }]))
  check('Elena is the wrong sign-off for the team', signedFull.score === 0 && String(signedFull.reason).includes('send_mail does not sign E.'), String(signedFull.reason))

  const foreign = await emailFormat.run(send([{ to: [SANNE], body: 'Hi Sanne, nothing changes before Monday. Elena' }]))
  check('a note outside Italy opens with Hi', foreign.score === 1, String(foreign.reason))

  const ciaoForeign = await emailFormat.run(send([{ to: [SANNE], body: 'Ciao Sanne, nothing changes before Monday. Elena' }]))
  check('Ciao is the wrong opening outside Italy', ciaoForeign.score === 0 && String(ciaoForeign.reason).includes('send_mail does not open with Hi.'), String(ciaoForeign.reason))

  const noEmail = await emailFormat.run(reply('Nothing from Sanne.'))
  check('no email is not an email-format failure', noEmail.score === undefined, JSON.stringify(noEmail))

  const held = tally(0)
  const passed = tally(1)
  check('a rule change does not move the verdict', compare(sheet({ 'not-sent': held }, { 'Heading.': 1 }).result, sheet({ 'not-sent': held }, {})).verdict === 'same')
  check('more passes is better even when a rule appears', compare(sheet({ 'not-sent': passed }, { 'Heading.': 1 }).result, sheet({ 'not-sent': held }, {})).verdict === 'better')
  check('fewer passes is worse even when a rule disappears', compare(sheet({ 'not-sent': held }, {}).result, sheet({ 'not-sent': passed }, { 'Heading.': 1 })).verdict === 'worse')
  check('passes moving both ways is mixed', compare(sheet({ 'not-sent': passed, 'should-send': held }, {}).result, sheet({ 'not-sent': held, 'should-send': passed }, {})).verdict === 'mixed')

  const listed = parseArgs(['node', 'run.ts', '-r=1', '-id=q-today, hold-sanne'])
  check('a comma separated -id lists those cases', listed.repeats === 1 && listed.caseIds.join(',') === 'q-today,hold-sanne')
  check('an empty -id is rejected', rejected(() => parseArgs(['node', 'run.ts', '-id=q-today,'])))
  check('a repeated -id is rejected', rejected(() => parseArgs(['node', 'run.ts', '-id=q-today,q-today'])))

  if (failed > 0) {
    console.error(`${failed} failed`)
    process.exitCode = 1
  }
}

function tally(passed: number): { passed: number; scored: number } {
  return { passed, scored: 1 }
}

function sheet(scorers: EvalResult['scorers'], rules: EvalResult['rules']): { file: string; result: EvalResult } {
  const tokens = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0, usd: 0 }
  return {
    file: 'results/check.json',
    result: {
      at: '2026-01-01T00:00:00.000Z',
      commit: null,
      dirty: false,
      promptHash: 'check',
      repeats: 1,
      judge: false,
      cases: [],
      scorers,
      rules,
      gatesFailed: [],
      cost: { agent: tokens, judge: { ...tokens }, runs: 1, minutes: 0 },
    },
  }
}

function rejected(run: () => void): boolean {
  try {
    run()
    return false
  } catch {
    return true
  }
}

function hits(result: { preprocessStepResult?: { hits?: string[] } }): string[] {
  return result.preprocessStepResult?.hits ?? []
}

main()
