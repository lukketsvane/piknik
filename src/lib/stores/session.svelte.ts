import { goto } from '$app/navigation'
import { supabase } from '$lib/supabase'
import type { User } from '$lib/types'

class SessionStore {
	sessionStarted = $state(false)
	sessionCode = $state('')
	currentUser = $state<User | null>(null)
	participants = $state<User[]>([])

	private channel: ReturnType<typeof supabase.channel> | null = null

	async createSession(username: string) {
		const code = Math.floor(1000 + Math.random() * 9000).toString()
		const newUser: User = {
			id: '',
			namn: username,
			farge: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
		}

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
		this.sessionCode = code
		this.currentUser = newUser
		this.participants = [newUser]
		this.sessionStarted = true

		this.subscribeToPresence()
		await goto(`/${code}`)
	}

	async joinSession(username: string, code: string) {
		const { data: sessionData, error: sessionError } = await supabase
			.from('sessions')
			.select('id')
			.eq('code', code)
			.single()

		if (sessionError) {
			console.error('Error finding session:', sessionError)
			return
		}

		const newUser: User = {
			id: '',
			namn: username,
			farge: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
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
		this.currentUser = newUser
		this.sessionCode = code
		this.sessionStarted = true

		// Load existing participants
		await this.loadSessionData(code)
		this.subscribeToPresence()
		await goto(`/${code}`)
	}

	async initFromCode(code: string) {
		this.sessionCode = code
	}

	private async loadSessionData(code: string) {
		const { data, error } = await supabase.rpc('get_session_data', { p_session_code: code })

		if (error) {
			console.error('Error loading session data:', error)
			return
		}

		const users = data.reduce((acc: User[], curr: any) => {
			if (curr.user_id && !acc.some((u: User) => u.id === curr.user_id)) {
				acc.push({ id: curr.user_id, namn: curr.user_name, farge: curr.user_color })
			}
			return acc
		}, [])
		this.participants = users
	}

	private subscribeToPresence() {
		if (this.channel) {
			this.channel.unsubscribe()
		}

		this.channel = supabase.channel(`room:${this.sessionCode}`)
		this.channel
			.on('presence', { event: 'sync' }, () => {
				const state = this.channel!.presenceState()
				const participants = Object.values(state).flat() as User[]
				this.participants = participants
			})
			.subscribe(async (status) => {
				if (status === 'SUBSCRIBED' && this.currentUser) {
					await this.channel!.track(this.currentUser)
				}
			})
	}

	async stopSession() {
		if (this.currentUser && this.sessionCode) {
			if (this.channel) {
				await this.channel.untrack()
				await this.channel.unsubscribe()
				this.channel = null
			}

			await supabase.from('users').delete().eq('id', this.currentUser.id)

			this.sessionStarted = false
			this.sessionCode = ''
			this.currentUser = null
			this.participants = []
		}
		await goto('/')
	}

	cleanup() {
		if (this.channel) {
			this.channel.unsubscribe()
			this.channel = null
		}
	}
}

export const sessionStore = new SessionStore()
