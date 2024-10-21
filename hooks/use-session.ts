import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  'https://apenpdwhwhcdfoksstsf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZW5wZHdod2hjZGZva3NzdHNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTE2MjUyNSwiZXhwIjoyMDQ0NzM4NTI1fQ.6azz4luS5CSBi6OGsyi_tw7NczajdvBRaUYZHqVJAY4'
)

export type User = {
  id: string
  namn: string
  farge: string
}

export function useSession(initialSessionCode?: string) {
  const router = useRouter()
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionCode, setSessionCode] = useState(initialSessionCode || '')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [participants, setParticipants] = useState<User[]>([])

  useEffect(() => {
    if (initialSessionCode) {
      setSessionStarted(true)
      setSessionCode(initialSessionCode)
      joinSession(initialSessionCode)
    }
  }, [initialSessionCode])

  useEffect(() => {
    if (sessionStarted && sessionCode) {
      const channel = supabase.channel(`room:${sessionCode}`)
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const participants = Object.values(state).flat() as User[]
          setParticipants(participants)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && currentUser) {
            await channel.track(currentUser)
          }
        })

      return () => {
        channel.unsubscribe()
      }
    }
  }, [sessionStarted, sessionCode, currentUser])

  const joinSession = async (code: string) => {
    const { data, error } = await supabase
      .rpc('get_session_data', { p_session_code: code })

    if (error) {
      console.error('Error joining session:', error)
      return
    }

    const sessionData = data[0]
    setSessionCode(sessionData.session_code)
    
    const users = data.reduce((acc: User[], curr: any) => {
      if (curr.user_id && !acc.some((u: User) => u.id === curr.user_id)) {
        acc.push({ id: curr.user_id, namn: curr.user_name, farge: curr.user_color })
      }
      return acc
    }, [])
    setParticipants(users)

    setSessionStarted(true)
  }

  const handleCreateSession = async (username: string) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    const newUser: User = { id: '', namn: username, farge: '#' + Math.floor(Math.random()*16777215).toString(16) }

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({ code })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({ session_id: sessionData.id, name: newUser.namn, color: newUser.farge })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      return
    }

    newUser.id = userData.id
    setSessionCode(code)
    setCurrentUser(newUser)
    setParticipants([newUser])
    setSessionStarted(true)

    router.push(`/${code}`)
  }

  const handleJoinSession = async (username: string, code: string) => {
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('code', code)
      .single()

    if (sessionError) {
      console.error('Error finding session:', sessionError)
      return
    }

    const newUser: User = { id: '', namn: username, farge: '#' + Math.floor(Math.random()*16777215).toString(16) }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({ session_id: sessionData.id, name: newUser.namn, color: newUser.farge })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      return
    }

    newUser.id = userData.id
    setCurrentUser(newUser)
    setSessionStarted(true)
    await joinSession(code)
    router.push(`/${code}`)
  }

  return {
    sessionStarted,
    sessionCode,
    currentUser,
    participants,
    handleCreateSession,
    handleJoinSession
  }
}