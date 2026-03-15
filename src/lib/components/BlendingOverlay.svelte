<script lang="ts">
	import { onDestroy } from 'svelte'

	let { isBlending }: { isBlending: boolean } = $props()

	const phases = [
		{ animation: 'carry-boxes', message: 'Samlar ingrediensar...' },
		{ animation: 'run-fast', message: 'Spring til kjokenet...' },
		{ animation: 'dance-music', message: 'Blandar oppskrift...' }
	]

	let phaseIndex = $state(0)
	let timers: ReturnType<typeof setTimeout>[] = []

	$effect(() => {
		if (isBlending) {
			phaseIndex = 0
			// Phase 2 at 2s
			const t1 = setTimeout(() => { phaseIndex = 1 }, 2000)
			// Phase 3 at 5s
			const t2 = setTimeout(() => { phaseIndex = 2 }, 5000)
			timers = [t1, t2]
		} else {
			timers.forEach(clearTimeout)
			timers = []
			phaseIndex = 0
		}
	})

	onDestroy(() => {
		timers.forEach(clearTimeout)
	})

	let currentPhase = $derived(phases[phaseIndex])
</script>

{#if isBlending}
	<div class="fixed inset-0 z-40 flex items-center justify-center" style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.9) 0%, rgba(147, 51, 234, 0.85) 100%);">
		<div class="absolute inset-0 blend-overlay"></div>
		<div class="relative flex flex-col items-center gap-6 p-8">
			{#key phaseIndex}
				<img
					src="/piknik/{currentPhase.animation}.gif"
					alt="Blandar..."
					class="w-72 h-72 object-contain mascot-enter"
				/>
			{/key}

			<div class="text-center">
				<p class="text-white font-black text-2xl mb-2">{currentPhase.message}</p>
				<div class="flex items-center justify-center gap-1.5">
					{#each phases as _, i}
						<div class="w-2 h-2 rounded-full transition-all duration-300
							{i === phaseIndex ? 'bg-white w-6' : i < phaseIndex ? 'bg-white/80' : 'bg-white/30'}">
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
