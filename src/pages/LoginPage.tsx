import { FormEvent, useState } from 'react'
import { login } from '../api/endpoints'
import { AuthCard } from '../components/AuthCard'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { reportLoggedIn } from '../lib/session'
import { serverMessage } from '../lib/utils'

/**
 * Username and password. Shown by the gate in App.tsx at whatever address was opened, and the address is
 * never changed, so logging in at /downloads lands on the Downloads page. Spotify, YouTube Music and
 * Navidrome all keep you signed in afterwards; here that is the server's 30-day cookie.
 */
export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { username: name } = await login(username.trim(), password)
      reportLoggedIn(name)
    } catch (err) {
      // The server's own sentence: "Wrong username or password", "Too many attempts, wait a moment".
      setError(serverMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Log in">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="login-username" className="text-sm text-zinc-300">Username</label>
          <Input id="login-username" autoComplete="username" autoFocus required value={username}
            onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="text-sm text-zinc-300">Password</label>
          <Input id="login-password" type="password" autoComplete="current-password" required value={password}
            onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Button>
      </form>
    </AuthCard>
  )
}
