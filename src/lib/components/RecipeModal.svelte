<script lang="ts">
	import type { Oppskrift } from '$lib/types'
	import { X } from 'lucide-svelte'

	let { oppskrift, onClose }: { oppskrift: Oppskrift; onClose: () => void } = $props()
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 bg-black/50 flex items-end justify-center z-50 blend-overlay"
	onkeydown={(e) => e.key === 'Escape' && onClose()}
>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="absolute inset-0" onclick={onClose}></div>
	<div
		class="relative w-full max-w-md bg-white rounded-t-3xl bottom-sheet-enter safe-bottom overflow-hidden"
		style="max-height: 90vh"
	>
		<!-- Header -->
		<div class="bg-piknik-gradient-card px-5 pt-5 pb-5 relative">
			<button class="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white tap-feedback" onclick={onClose}>
				<X class="h-5 w-5" />
			</button>
			<h2 class="text-[28px] font-black text-white leading-tight pr-10">{oppskrift.tittel}</h2>
			<p class="text-white/80 text-[15px] font-medium mt-1">{oppskrift.skildring}</p>
		</div>

		<!-- Content -->
		<div class="overflow-y-auto scroll-area" style="max-height: calc(90vh - 140px)">
			<!-- Ingredients as compact chips -->
			<div class="px-5 py-4">
				<div class="flex flex-wrap gap-2 stagger-in" style="animation-delay: 100ms">
					{#each oppskrift.ingrediensar as ing}
						<span class="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 rounded-full text-[14px] font-bold text-purple-700">
							{ing.mengde} {ing.eining} {ing.namn}
						</span>
					{/each}
				</div>
			</div>

			<!-- Steps -->
			<div class="px-5 pb-8">
				<ol class="space-y-4 stagger-in" style="animation-delay: 200ms">
					{#each oppskrift.steg as steg, index}
						<li class="flex gap-3">
							<div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white text-[14px] font-black flex items-center justify-center">
								{index + 1}
							</div>
							<p class="text-[15px] leading-relaxed text-gray-800 font-medium pt-1">{steg}</p>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</div>
</div>
