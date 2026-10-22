import { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DoneStep } from '../components/setup/DoneStep'
import { DownloadQualityStep } from '../components/setup/DownloadQualityStep'
import { ExposureStep } from '../components/setup/ExposureStep'
import { MediaServerStep } from '../components/setup/MediaServerStep'
import { PlaylistsStep } from '../components/setup/PlaylistsStep'
import { SetupStep } from '../components/setup/SetupStep'
import { SoulseekStep } from '../components/setup/SoulseekStep'
import { QUALITY_FALLBACK } from '../lib/downloadQuality'
import { stepIndex, stepPath } from '../lib/setup'

/**
 * The first-run setup, shown instead of the app until it is finished: one question per screen, like
 * a new phone, in Jellyfin's wizard order (what the app cannot work without first, the outside login
 * last, then "You're done"). The address is the step (/setup/1, /setup/2 …), so Back, a reload and
 * the return from Authentik keep the place. Each screen's body is the component the Settings page
 * hosts, given `onDone` to move on; the frame adds the question, the help line and the Skip link.
 * Skipping keeps the default and leads to the same last screen, whose Finish marks the setup done.
 */
/** `noSkip`: the screen's own controls are the choice, so no Skip link under them. */
const steps: { title: string; help?: string; body: (next: () => void) => ReactNode; noSkip?: boolean }[] = [
  {
    title: 'What quality do you want your music in?',
    help: `Every download is looked for at this quality first. ${QUALITY_FALLBACK}`,
    body: next => <DownloadQualityStep onDone={next} />,
    // A row saves on press, so Next with the default marked IS the skip (as the playlists switch); a Skip link under a row just pressed would read as undoing it, and would not.
    noSkip: true,
  },
  {
    title: 'Your Soulseek account',
    help: 'naviseerr downloads from the Soulseek network as this account. Passwords cannot be reset, so write it down.',
    body: next => <SoulseekStep onDone={next} />,
  },
  {
    title: 'Which app plays your music?',
    help: 'naviseerr asks that app to rescan the moment a song or playlist lands. Neither? Your app still finds new files on its own schedule.',
    body: next => <MediaServerStep onDone={next} />,
  },
  {
    title: 'Want a fresh set of playlists every week?',
    help: 'Every Monday night naviseerr builds 49 playlists from what is popular right now (about 90 minutes; it asks Discogs and YouTube Music). The first set starts as soon as you switch it on. Off unless you say yes.',
    body: next => <PlaylistsStep onDone={next} />,
    // The switch saves on flip, so Next with it off IS the skip (Home Assistant's shape); a Skip link beside a switch just turned on would read as undoing it, and would not.
    noSkip: true,
  },
  {
    title: 'Will you reach naviseerr from outside your home?',
    body: next => <ExposureStep onDone={next} />,
    noSkip: true,
  },
]

const welcome = (libraryRoot: string | null) =>
  'Welcome to naviseerr. Five short questions; skip any, change all of them later in Settings.'
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
      title={current.title} help={current.help} skipTo={current.noSkip ? undefined : stepPath(index + 1)}>
      {current.body(next)}
    </SetupStep>
  )
}
