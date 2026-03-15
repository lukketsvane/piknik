<script lang="ts">
	let {
		animation,
		message = '',
		size = 'md'
	}: {
		animation: string
		message?: string
		size?: 'sm' | 'md' | 'lg'
	} = $props()

	const sizeClasses: Record<string, string> = {
		sm: 'w-40 h-40',
		md: 'w-64 h-64',
		lg: 'w-80 h-80'
	}

	const videoAnimations = ['sleep-loop']

	let isVideo = $derived(videoAnimations.includes(animation))

	let fadeKey = $state(0)
	let prevAnimation = ''

	$effect(() => {
		if (animation !== prevAnimation) {
			fadeKey++
			prevAnimation = animation
		}
	})
</script>

<div class="flex flex-col items-center gap-2">
	{#if message}
		<div class="speech-bubble">
			<p class="text-[15px] font-bold text-purple-800 text-center whitespace-nowrap">{message}</p>
		</div>
	{/if}

	{#key fadeKey}
		{#if isVideo}
			<video
				src="/piknik/{animation}.mp4"
				autoplay
				loop
				muted
				playsinline
				class="{sizeClasses[size]} object-contain mascot-enter"
			></video>
		{:else}
			<img
				src="/piknik/{animation}.gif"
				alt="PikNik maskot"
				class="{sizeClasses[size]} object-contain mascot-enter"
			/>
		{/if}
	{/key}
</div>
