import { browser } from '$app/environment'

class AudioStore {
	isMuted = $state(false)
	private backgroundAudio: HTMLAudioElement | null = null
	private blendingAudio: HTMLAudioElement | null = null
	private initialized = false

	init() {
		if (!browser || this.initialized) return
		this.initialized = true

		this.backgroundAudio = new Audio('/music/going_places.mp3')
		this.backgroundAudio.loop = true
		this.blendingAudio = new Audio('/music/spanish_flea.mp3')
	}

	playBackground() {
		if (!this.backgroundAudio || this.isMuted) return
		this.backgroundAudio.play().catch((e) => console.error('Background audio error:', e))
	}

	stopBackground() {
		if (!this.backgroundAudio) return
		this.backgroundAudio.pause()
	}

	playBlending() {
		if (!this.blendingAudio || this.isMuted) return
		this.blendingAudio.play().catch((e) => console.error('Blending audio error:', e))
	}

	stopBlending() {
		if (!this.blendingAudio) return
		this.blendingAudio.pause()
		this.blendingAudio.currentTime = 0
	}

	toggleMute() {
		this.isMuted = !this.isMuted

		if (this.isMuted) {
			this.backgroundAudio?.pause()
			this.blendingAudio?.pause()
		} else {
			this.backgroundAudio
				?.play()
				.catch((e) => console.error('Background audio error:', e))
		}
	}

	cleanup() {
		if (this.backgroundAudio) {
			this.backgroundAudio.pause()
			this.backgroundAudio = null
		}
		if (this.blendingAudio) {
			this.blendingAudio.pause()
			this.blendingAudio = null
		}
		this.initialized = false
	}
}

export const audioStore = new AudioStore()
