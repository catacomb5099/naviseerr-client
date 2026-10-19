import { ComponentType, FormEvent, useState } from 'react'
import { getSession, setupAccount } from '../api/endpoints'
import { AuthCard } from '../components/AuthCard'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { applySession, reportLoggedIn } from '../lib/session'
import { serverMessage } from '../lib/utils'

/** One step of the first-run screen: calls onDone when finished, with the account name if it made one. */
interface StepProps { onDone: (username?: string) => void }

/**
 * First run, like Jellyfin's setup wizard and Navidrome's "Create Admin": the install has no account
 * yet, so make one. The steps run in order and the app shows once the last one is done; the account's
 * existence is the only thing remembered (GET /auth/session says `setupRequired`), nothing else is.
 * Other asks append their step here (a Soulseek account step, say); keep the account step first.
 */
const steps: ComponentType<StepProps>[] = [AccountStep]

export function SetupPage() {
  const [index, setIndex] = useState(0)
  const [username, setUsername] = useState('')
  const Step = steps[index]
  const done = (name?: string) => {
    const who = name ?? username
    setUsername(who)
    if (index + 1 < steps.length) setIndex(index + 1)
    else reportLoggedIn(who)
  }
  return <Step onDone={done} />
}

function AccountStep({ onDone }: StepProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const name = username.trim()
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError("The passwords don't match.")
    setBusy(true)
    setError(null)
    try {
      const made = await setupAccount(name, password)
      onDone(made.username)
    } catch (err) {
      setError(serverMessage(err))
      setBusy(false)
      // "An account already exists": somebody else made it first. Ask again and the gate shows the login.
      void getSession().then(applySession, () => undefined)
    }
  }

  return (
    <AuthCard title="Create your account">
      <p className="text-sm text-zinc-400 mb-4">
        This Naviseerr has no account yet. Choose the name and password you will log in with.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="setup-username" className="text-sm text-zinc-300">Username</label>
          <Input id="setup-username" autoComplete="username" autoFocus required maxLength={30} value={username}
            onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="setup-password" className="text-sm text-zinc-300">Password</label>
          <Input id="setup-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}
            value={password} onChange={e => setPassword(e.target.value)} />
          <p className="text-xs text-zinc-500">8 to 72 characters.</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="setup-confirm" className="text-sm text-zinc-300">Password again</label>
          <Input id="setup-confirm" type="password" autoComplete="new-password" required maxLength={72} value={confirm}
            onChange={e => setConfirm(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</Button>
      </form>
    </AuthCard>
  )
}
