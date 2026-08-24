import { useCallback, useEffect, useRef, useState } from 'react'

const MUTE_KEY = 'naviseerr.downloads.muted'

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

/** Lazily-constructed AudioContext that plays a short filtered-noise "swoosh"
 *  for a dismissed download card, plus a persisted mute toggle. */
export function useDismissSound() {
  const [muted, setMuted] = useState<boolean>(readMuted)
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
    } catch {
      // localStorage unavailable (private mode, disabled) - sound preference just won't persist
    }
  }, [muted])

  const playSwoosh = useCallback(() => {
    if (muted) return
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      if (!ctxRef.current) ctxRef.current = new AudioCtx()
      const ctx = ctxRef.current

      const duration = 0.22
      const sampleCount = Math.floor(ctx.sampleRate * duration)
      const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < sampleCount; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sampleCount, 2.2)
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.Q.value = 1.1
      const now = ctx.currentTime
      filter.frequency.setValueAtTime(2400, now)
      filter.frequency.exponentialRampToValueAtTime(320, now + duration)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.16, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      source.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      source.start(now)
    } catch {
      // Audio playback is best-effort; never let a sound failure break dismissal
    }
  }, [muted])

  const toggleMuted = useCallback(() => setMuted(m => !m), [])

  return { muted, toggleMuted, playSwoosh }
}
