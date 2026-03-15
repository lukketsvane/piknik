<script lang="ts">
	let { currentStep }: { currentStep: number } = $props()

	const steps = [
		{ label: 'Legg til', shortLabel: 'Legg til' },
		{ label: 'Vel', shortLabel: 'Vel' },
		{ label: 'Kok', shortLabel: 'Kok' }
	]
</script>

<div class="flex items-center justify-center gap-0 px-6 py-3">
	{#each steps as step, i}
		{@const stepNum = i + 1}
		{@const isCompleted = currentStep > stepNum}
		{@const isActive = currentStep === stepNum}
		{@const isFuture = currentStep < stepNum}

		{#if i > 0}
			<div class="flex-1 h-0.5 mx-1 rounded-full transition-colors duration-300 {isCompleted ? 'bg-purple-500' : 'bg-purple-200'}"></div>
		{/if}

		<div class="flex flex-col items-center gap-1">
			<div
				class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-300
					{isCompleted ? 'bg-purple-500 text-white step-complete' : ''}
					{isActive ? 'bg-purple-500 text-white ring-4 ring-purple-200' : ''}
					{isFuture ? 'bg-purple-100 text-purple-400' : ''}"
			>
				{#if isCompleted}
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				{:else}
					{stepNum}
				{/if}
			</div>
			<span class="text-[12px] font-bold tracking-wide
				{isActive ? 'text-purple-700' : ''}
				{isCompleted ? 'text-purple-500' : ''}
				{isFuture ? 'text-gray-400' : ''}"
			>
				{step.shortLabel}
			</span>
		</div>
	{/each}
</div>
