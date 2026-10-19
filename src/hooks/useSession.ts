import { useSyncExternalStore } from 'react'
import { getSession, subscribe } from '../lib/session'

/** The session snapshot; re-renders the caller when it changes. */
export const useSession = () => useSyncExternalStore(subscribe, getSession)
