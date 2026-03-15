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
		<!-- Gradient header with mascot -->
		<div class="bg-piknik-gradient-card px-6 pt-4 pb-6 relative">
			<button class="absolute top-3 right-3 p-2 rounded-full bg-white/20 text-white" onclick={onClose}>
				<X class="h-5 w-5" />
			</button>
			<div class="flex items-end gap-3">
				<img
					src="/piknik/happy-bounce-a.gif"
					alt="Glad maskot"
					class="w-28 h-28 object-contain mascot-enter"
				/>
				<div class="flex-1 min-w-0 pb-1">
					<p class="text-purple-200 text-[12px] font-bold uppercase tracking-wider mb-1">Oppskrift klar!</p>
					<h2 class="text-2xl font-black text-white truncate">{oppskrift.tittel}</h2>
				</div>
			</div>
		</div>

		<!-- Drag handle -->
		<div class="flex justify-center pt-3 pb-1">
			<div class="w-10 h-1 bg-gray-200 rounded-full"></div>
		</div>

		<!-- Content -->
		<div class="px-6 py-4 overflow-y-auto" style="max-height: calc(90vh - 180px)">
			<p class="text-gray-600 text-[16px] font-medium mb-6 stagger-in" style="animation-delay: 100ms">{oppskrift.skildring}</p>

			<h3 class="text-[14px] font-black uppercase tracking-wider text-purple-600 mb-3 stagger-in" style="animation-delay: 200ms">Ingrediensar</h3>
			<div class="grid grid-cols-2 gap-2 mb-6 stagger-in" style="animation-delay: 300ms">
				{#each oppskrift.ingrediensar as ing}
					<div class="bg-purple-50 rounded-xl p-3 flex flex-col">
						<span class="text-[15px] font-bold text-gray-900">{ing.namn}</span>
						<span class="text-[13px] text-purple-500 font-semibold">{ing.mengde} {ing.eining}</span>
					</div>
				{/each}
			</div>

			<h3 class="text-[14px] font-black uppercase tracking-wider text-purple-600 mb-3 stagger-in" style="animation-delay: 400ms">Framgangsmåte</h3>
			<ol class="space-y-4 pb-6 stagger-in" style="animation-delay: 500ms">
				{#each oppskrift.steg as steg, index}
					<li class="flex gap-3">
						<div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-extrabold flex items-center justify-center">
							{index + 1}
						</div>
						<span class="text-[16px] leading-relaxed text-gray-700 font-medium pt-1">{steg}</span>
					</li>
				{/each}
			</ol>
		</div>
	</div>
</div>
