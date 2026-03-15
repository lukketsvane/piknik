<script lang="ts">
	import type { Ingrediens, Kategori, Eining } from '$lib/types'
	import { ingredientsStore } from '$lib/stores/ingredients.svelte'
	import { searchFood, type FoodItem } from '$lib/data/food-database'

	let {
		isOpen,
		onClose,
		sessionCode
	}: {
		isOpen: boolean
		onClose: () => void
		sessionCode: string
	} = $props()

	let namn = $state('')
	let mengde = $state('')
	let eining = $state<Eining>('stk')
	let kategori = $state<Kategori>('Anna')
	let suggestions = $state<FoodItem[]>([])
	let showSuggestions = $state(false)

	const einingar: Eining[] = ['stk', 'g', 'kg', 'dl', 'ml', 'l', 'ss', 'ts', 'hg']
	const kategoriar: { value: Kategori; emoji: string }[] = [
		{ value: 'Frukt', emoji: '🍎' },
		{ value: 'Grønsaker', emoji: '🥕' },
		{ value: 'Meieri', emoji: '🧀' },
		{ value: 'Fisk', emoji: '🐟' },
		{ value: 'Bakevarer', emoji: '🍞' },
		{ value: 'Kjøt', emoji: '🥩' },
		{ value: 'Anna', emoji: '🍽️' }
	]

	$effect(() => {
		if (ingredientsStore.redigeringIngrediens && isOpen) {
			const ing = ingredientsStore.redigeringIngrediens
			namn = ing.namn
			mengde = String(ing.mengde)
			eining = ing.eining
			kategori = ing.kategori
		} else if (isOpen) {
			resetForm()
		}
	})

	function resetForm() {
		namn = ''
		mengde = ''
		eining = 'stk'
		kategori = 'Anna'
		suggestions = []
		showSuggestions = false
	}

	function handleNameInput() {
		if (namn.length >= 1) {
			suggestions = searchFood(namn)
			showSuggestions = suggestions.length > 0
		} else {
			suggestions = []
			showSuggestions = false
		}
	}

	function selectSuggestion(item: FoodItem) {
		namn = item.namn
		mengde = String(item.mengde)
		eining = item.eining
		kategori = item.kategori
		showSuggestions = false
	}

	async function handleSubmit(e: Event) {
		e.preventDefault()
		const ingrediens: Ingrediens = {
			id: ingredientsStore.redigeringIngrediens?.id,
			namn,
			mengde: parseFloat(mengde),
			eining,
			kategori,
			bilde: '',
			brukar: null
		}

		if (ingredientsStore.redigeringIngrediens) {
			await ingredientsStore.updateIngredient(ingrediens, sessionCode)
		} else {
			await ingredientsStore.addIngredient(ingrediens, sessionCode)
		}

		resetForm()
		onClose()
	}

	function handleClose() {
		ingredientsStore.redigeringIngrediens = null
		resetForm()
		onClose()
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 blend-overlay"
		onkeydown={(e) => e.key === 'Escape' && handleClose()}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="absolute inset-0" onclick={handleClose}></div>
		<div
			class="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl bottom-sheet-enter safe-bottom overflow-hidden"
		>
			<div class="flex items-center gap-3 px-6 pt-5 pb-3">
				<h2 class="text-xl font-black text-gray-900">
					{ingredientsStore.redigeringIngrediens ? 'Rediger' : 'Legg til'}
				</h2>
				<button class="p-2 rounded-full hover:bg-purple-50 ml-auto transition-colors" onclick={handleClose}> ✕ </button>
			</div>

			<form onsubmit={handleSubmit} class="px-6 pb-6 space-y-3">
				<!-- Name input with autocomplete -->
				<div class="relative">
					<input
						type="text"
						bind:value={namn}
						oninput={handleNameInput}
						onfocus={handleNameInput}
						placeholder="Søk eller skriv ingrediens..."
						required
						autocomplete="off"
						class="w-full h-13 px-4 py-3 border-2 border-purple-200 rounded-2xl bg-purple-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-[16px] font-semibold transition-all"
					/>

					{#if showSuggestions}
						<div class="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-purple-200 rounded-2xl overflow-hidden z-10 max-h-48 overflow-y-auto">
							{#each suggestions as item}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-purple-50 tap-feedback transition-colors"
									onclick={() => selectSuggestion(item)}
								>
									<span class="text-[15px] font-bold text-gray-900">{item.namn}</span>
									<span class="text-[13px] font-semibold text-purple-500">{item.mengde} {item.eining}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="flex gap-3">
					<input
						type="number"
						bind:value={mengde}
						placeholder="Mengde"
						required
						class="w-1/2 h-13 px-4 py-3 border-2 border-purple-200 rounded-2xl bg-purple-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-[16px] font-semibold transition-all"
					/>
					<div class="w-1/2 flex flex-wrap gap-1.5">
						{#each einingar as unit}
							<button
								type="button"
								class="px-2.5 py-1.5 rounded-xl text-[13px] font-bold transition-all
									{eining === unit
										? 'bg-purple-500 text-white'
										: 'bg-purple-50 text-purple-600 hover:bg-purple-100'}"
								onclick={() => (eining = unit)}
							>
								{unit}
							</button>
						{/each}
					</div>
				</div>

				<!-- Category chips -->
				<div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
					{#each kategoriar as cat}
						<button
							type="button"
							class="flex items-center gap-1 px-3 py-2 rounded-2xl text-[13px] font-bold whitespace-nowrap transition-all flex-shrink-0
								{kategori === cat.value
									? 'bg-purple-500 text-white'
									: 'bg-purple-50 text-purple-700 hover:bg-purple-100'}"
							onclick={() => (kategori = cat.value)}
						>
							<span>{cat.emoji}</span>
							{cat.value}
						</button>
					{/each}
				</div>

				<button
					type="submit"
					class="w-full h-14 rounded-2xl bg-piknik-gradient text-white font-black text-[17px] transition-all active:scale-[0.97]"
				>
					{ingredientsStore.redigeringIngrediens ? 'Oppdater' : 'Legg til'}
				</button>
			</form>
		</div>
	</div>
{/if}
