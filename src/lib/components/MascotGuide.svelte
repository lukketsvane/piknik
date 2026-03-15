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
		sm: 'w-20 h-20',
		md: 'w-32 h-32',
		lg: 'w-44 h-44'
	}

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
			<p class="text-[13px] font-medium text-purple-800 text-center whitespace-nowrap">{message}</p>
		</div>
	{/if}

	{#key fadeKey}
		<img
			src="/piknik/{animation}.gif"
			alt="PikNik maskot"
			class="{sizeClasses[size]} object-contain mascot-enter"
		/>
	{/key}
</div>
