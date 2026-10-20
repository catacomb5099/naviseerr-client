import { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DoneStep } from '../components/setup/DoneStep'
import { SetupStep } from '../components/setup/SetupStep'
import { SoulseekStep } from '../components/setup/SoulseekStep'
import { stepIndex, stepPath } from '../lib/setup'

/**
 * The first-run setup, shown instead of the app until it is finished: one question per screen, like
 * a new phone, in Jellyfin's wizard order (what the app cannot work without first, the outside login
 * last, then "You're done"). The address is the step (/setup/1, /setup/2 …), so Back, a reload and
 * the return from Authentik keep the place. Each screen's body is the component the Settings page
 * hosts, given `onDone` to move on; the frame adds the question, the help line and the Skip link.
 * Skipping keeps the default and leads to the same last screen, whose Finish marks the setup done.
 */
const steps: { title: string; help: string; body: (next: () => void) => ReactNode }[] = [
  {
    title: 'Your Soulseek account',
    help: 'naviseerr downloads from the Soulseek network as this account. Passwords cannot be reset, so write it down.',
    body: next => <SoulseekStep onDone={next} />,
  },
]

const welcome = (libraryRoot: string | null) =>
  'Welcome to naviseerr. A few short questions; skip any, change all of them later in Settings.'
  + (libraryRoot ? ` Your music lands in ${libraryRoot} (set in the install file).` : '')

export function SetupPage({ libraryRoot, onFinished }: { libraryRoot: string | null; onFinished: () => void }) {
  const { step } = useParams()
  const navigate = useNavigate()
  const index = stepIndex(step, steps.length + 1)
  const next = () => navigate(stepPath(index + 1))

  if (index === steps.length) {
    return (
      <SetupStep total={steps.length} title="You're all set"
        help="That is all naviseerr needs. Everything you set, and what you skipped, can be changed in Settings (the gear, top right).">
        <DoneStep libraryRoot={libraryRoot} onDone={onFinished} />
      </SetupStep>
    )
  }
  const current = steps[index]
  return (
    <SetupStep step={index + 1} total={steps.length} intro={index === 0 ? welcome(libraryRoot) : undefined}
      title={current.title} help={current.help} skipTo={stepPath(index + 1)}>
      {current.body(next)}
    </SetupStep>
  )
}
