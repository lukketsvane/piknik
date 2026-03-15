<script lang="ts">
	import type { Ingrediens, Kategori } from '$lib/types'
	import { ingredientsStore } from '$lib/stores/ingredients.svelte'
	import { Pencil, Trash2 } from 'lucide-svelte'

	let { sessionCode }: { sessionCode: string } = $props()

	const kategoriIkon: Record<Kategori, string> = {
		Frukt: '🍎',
		Grønsaker: '🥕',
		Meieri: '🧀',
		Fisk: '🐟',
		Bakevarer: '🍞',
		Kjøt: '🥩',
		Anna: '🍽️'
	}

	const kategoriClass: Record<Kategori, string> = {
		Frukt: 'category-frukt',
		Grønsaker: 'category-gronsaker',
		Meieri: 'category-meieri',
		Fisk: 'category-fisk',
		Bakevarer: 'category-bakevarer',
		Kjøt: 'category-kjot',
		Anna: 'category-anna'
	}

	function isSelected(ingrediens: Ingrediens) {
		return ingredientsStore.valgteIngrediensar.some((i) => i.id === ingrediens.id)
	}
</script>

{#if ingredientsStore.ingrediensar.length === 0}
	<!-- Empty state — mascot is already shown above by MascotGuide -->
{:else}
	<ul class="space-y-2.5">
		{#each ingredientsStore.ingrediensar as ingrediens, index (ingrediens.id)}
			{@const selected = isSelected(ingrediens)}
			<li class="ingredient-enter" style="animation-delay: {index * 50}ms">
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="w-full flex items-center p-3.5 rounded-2xl cursor-pointer transition-all duration-200 tap-feedback border-l-4
						{selected
							? 'bg-purple-50 border-l-purple-500 ring-2 ring-purple-300'
							: 'bg-white border-l-transparent ' + kategoriClass[ingrediens.kategori as Kategori]}"
					onclick={() => ingredientsStore.toggleSelection(ingrediens, sessionCode)}
				>
					<div class="flex items-center flex-grow min-w-0">
						<div
							class="w-11 h-11 mr-3 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-colors
								{selected ? 'bg-purple-100' : 'bg-gray-50'}"
						>
							{kategoriIkon[ingrediens.kategori as Kategori] || '🍽️'}
						</div>
						<div class="flex-grow min-w-0 text-left">
							<div class="font-bold text-[16px] truncate text-gray-900">{ingrediens.namn}</div>
							<div class="text-[14px] text-gray-500 font-semibold">{ingrediens.mengde} {ingrediens.eining}</div>
						</div>
					</div>
					<div class="flex gap-1 flex-shrink-0 ml-2">
						<button
							type="button"
							aria-label="Rediger {ingrediens.namn}"
							class="p-2 rounded-xl hover:bg-gray-100 transition-colors"
							onclick={(e) => {
								e.stopPropagation()
								ingredientsStore.startEdit(ingrediens)
							}}
						>
							<Pencil class="h-4 w-4 text-gray-400" />
						</button>
						<button
							type="button"
							aria-label="Slett {ingrediens.namn}"
							class="p-2 rounded-xl hover:bg-red-50 transition-colors"
							onclick={(e) => {
								e.stopPropagation()
								ingredientsStore.deleteIngredient(ingrediens, sessionCode)
							}}
						>
							<Trash2 class="h-4 w-4 text-gray-400" />
						</button>
					</div>
				</div>
			</li>
		{/each}
	</ul>
{/if}
