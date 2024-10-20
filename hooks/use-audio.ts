import { useState, useEffect, useRef } from 'react'

export function useAudio(sessionStarted: boolean, blandar: boolean) {
  const [isMuted, setIsMuted] = useState(false)
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null)
  const blendingAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      backgroundAudioRef.current = new Audio('/music/going_places.mp3')
      backgroundAudioRef.current.loop = true
      blendingAudioRef.current = new Audio('/music/spanish_flea.mp3')
    }

    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause()
        backgroundAudioRef.current = null
      }
      if (blendingAudioRef.current) {
        blendingAudioRef.current.pause()
        blendingAudioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (sessionStarted && backgroundAudioRef.current) {
      if (!isMuted) {
        backgroundAudioRef.current.play().catch(error => console.error('Error playing background audio:', error))
      } else {
        backgroundAudioRef.current.pause()
      }
    }
  }, [sessionStarted, isMuted])

  useEffect(() => {
    if (blandar && blendingAudioRef.current) {
      if (!isMuted) {
        blendingAudioRef.current.play().catch(error => console.error('Error playing blending audio:', error))
      } else {
        blendingAudioRef.current.pause()
      }
    } else if (blendingAudioRef.current) {
      blendingAudioRef.current.pause()
      blendingAudioRef.current.currentTime = 0
    }
  }, [blandar, isMuted])

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (backgroundAudioRef.current) {
      if (isMuted) {
        backgroundAudioRef.current.play().catch(error => console.error('Error playing background audio:', error))
      } else {
        backgroundAudioRef.current.pause()
      }
    }
    if (blendingAudioRef.current) {
      if (isMuted) {
        if (blandar) {
          blendingAudioRef.current.play().catch(error => console.error('Error playing blending audio:', error))
        }
      } else {
        blendingAudioRef.current.pause()
      }
    }
  }

  return { isMuted, toggleMute }
}