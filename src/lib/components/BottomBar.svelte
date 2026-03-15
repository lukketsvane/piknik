<script lang="ts">
	import { Volume2, VolumeX, Info, Trophy, LogOut } from 'lucide-svelte'
	import { audioStore } from '$lib/stores/audio.svelte'

	let {
		onShowInfo,
		onShowHistory,
		onQuit,
		activeTab = 'home'
	}: {
		onShowInfo: () => void
		onShowHistory: () => void
		onQuit: () => void
		activeTab?: string
	} = $props()
</script>

<div class="fixed bottom-0 left-0 right-0 z-30">
	<div class="bg-white/70 backdrop-blur-2xl safe-bottom" style="box-shadow: 0 -1px 20px rgba(124, 58, 237, 0.08);">
		<div class="max-w-[390px] mx-auto flex items-center justify-around py-2 px-2">
			<button
				class="flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl tap-feedback"
				onclick={() => audioStore.toggleMute()}
			>
				{#if audioStore.isMuted}
					<VolumeX class="h-6 w-6 text-gray-400" />
					<span class="text-[10px] font-medium text-gray-400">Lyd</span>
				{:else}
					<Volume2 class="h-6 w-6 text-purple-600" />
					<span class="text-[10px] font-semibold text-purple-600">Lyd</span>
				{/if}
			</button>

			<button
				class="flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl tap-feedback"
				onclick={onShowInfo}
			>
				<Info class="h-6 w-6 text-gray-400" />
				<span class="text-[10px] font-medium text-gray-400">Info</span>
			</button>

			<button
				class="flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl tap-feedback"
				onclick={onShowHistory}
			>
				<Trophy class="h-6 w-6 text-gray-400" />
				<span class="text-[10px] font-medium text-gray-400">Historikk</span>
			</button>

			<button
				class="flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl tap-feedback"
				onclick={onQuit}
			>
				<LogOut class="h-6 w-6 text-gray-400" />
				<span class="text-[10px] font-medium text-gray-400">Avslutt</span>
			</button>
		</div>
	</div>
</div>
