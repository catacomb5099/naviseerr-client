import { useSyncExternalStore } from 'react'
import { getConnectivity, setBrowserOffline, subscribe } from '../lib/connectivity'

/** The store's listeners plus the browser's own online/offline events, mirrored into the store. */
function subscribeWithBrowser(onChange: () => void) {
  const sync = () => setBrowserOffline(!navigator.onLine)
  sync()
  window.addEventListener('online', sync)
  window.addEventListener('offline', sync)
  const unsubscribe = subscribe(onChange)
  return () => {
    unsubscribe()
    window.removeEventListener('online', sync)
    window.removeEventListener('offline', sync)
  }
}

/** The connectivity snapshot; re-renders the caller on every change. */
export const useConnectivity = () => useSyncExternalStore(subscribeWithBrowser, getConnectivity)
