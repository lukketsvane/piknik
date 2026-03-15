<script lang="ts">
	import type { Ingrediens, Kategori, Eining } from '$lib/types'
	import { ingredientsStore } from '$lib/stores/ingredients.svelte'

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

	const einingar: Eining[] = ['dl', 'g', 'hg', 'kg', 'stk', 'ss', 'ts', 'ml', 'l']
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
	}

	async function handleSubmit(e: Event) {
		e.preventDefault()
		const ingrediens: Ingrediens = {
			id: ingredientsStore.redigeringIngrediens?.id,
			namn,
			mengde: parseFloat(mengde),
			eining,
			kategori,
			bilde: '/placeholder.svg?height=40&width=40',
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
			<!-- Header with mascot -->
			<div class="flex items-center gap-3 px-6 pt-5 pb-3">
				<img
					src="/piknik/walk-baguette-a.gif"
					alt="Maskot"
					class="w-12 h-12 object-contain"
				/>
				<h2 class="text-xl font-black text-gray-900">
					{ingredientsStore.redigeringIngrediens ? 'Rediger ingrediens' : 'Legg til ingrediens'}
				</h2>
				<button class="p-2 rounded-full hover:bg-purple-50 ml-auto transition-colors" onclick={handleClose}> ✕ </button>
			</div>

			<form onsubmit={handleSubmit} class="px-6 pb-6 space-y-4">
				<input
					type="text"
					bind:value={namn}
					placeholder="Ingrediensnamn"
					required
					class="w-full h-13 px-4 py-3 border-2 border-purple-100 rounded-2xl bg-purple-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-[16px] transition-all"
				/>

				<div class="flex gap-3">
					<input
						type="number"
						bind:value={mengde}
						placeholder="Mengde"
						required
						class="w-1/2 h-13 px-4 py-3 border-2 border-purple-100 rounded-2xl bg-purple-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-[16px] transition-all"
					/>
					<div class="w-1/2 flex flex-wrap gap-1.5">
						{#each einingar as unit}
							<button
								type="button"
								class="px-2.5 py-1.5 rounded-xl text-[13px] font-medium transition-all
									{eining === unit
										? 'bg-purple-500 text-white shadow-sm'
										: 'bg-purple-50 text-purple-600 hover:bg-purple-100'}"
								onclick={() => (eining = unit)}
							>
								{unit}
							</button>
						{/each}
					</div>
				</div>

				<!-- Category as horizontal scrolling chips -->
				<div>
					<p class="text-[12px] font-semibold uppercase tracking-wider text-purple-500 mb-2">Kategori</p>
					<div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
						{#each kategoriar as cat}
							<button
								type="button"
								class="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[14px] font-medium whitespace-nowrap transition-all flex-shrink-0
									{kategori === cat.value
										? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
										: 'bg-purple-50 text-purple-700 hover:bg-purple-100'}"
								onclick={() => (kategori = cat.value)}
							>
								<span class="text-base">{cat.emoji}</span>
								{cat.value}
							</button>
						{/each}
					</div>
				</div>

				<div class="flex gap-3 pt-2">
					<button
						type="button"
						class="flex-1 py-3.5 rounded-2xl border-2 border-purple-100 font-semibold text-purple-600 hover:bg-purple-50 transition-colors"
						onclick={handleClose}
					>
						Avbryt
					</button>
					<button
						type="submit"
						class="flex-1 py-3.5 rounded-2xl bg-piknik-gradient text-white font-extrabold text-[16px] transition-all"
					>
						{ingredientsStore.redigeringIngrediens ? 'Oppdater' : 'Legg til'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
