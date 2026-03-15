<script lang="ts">
	import type { Oppskrift, Ingrediens } from '$lib/types'
	import { recipesStore } from '$lib/stores/recipes.svelte'
	import { ArrowLeft, ChevronRight } from 'lucide-svelte'

	let {
		isOpen,
		onClose,
		onSelectRecipe,
		sessionCode
	}: {
		isOpen: boolean
		onClose: () => void
		onSelectRecipe: (recipe: Oppskrift) => void
		sessionCode: string
	} = $props()

	let selectedRecipe = $state<Oppskrift | null>(null)
	let activeTab = $state<'session' | 'community'>('session')

	let recipes = $derived(
		activeTab === 'session'
			? recipesStore.sessionRecipes
			: recipesStore.recipeHistory
	)

	function formatIngredient(ingrediens: Ingrediens) {
		return `${ingrediens.mengde} ${ingrediens.eining} ${ingrediens.namn}`
	}

	function handleSelectRecipe(recipe: Oppskrift) {
		selectedRecipe = recipe
	}

	function handleReturn() {
		selectedRecipe = null
	}

	function handleUseRecipe() {
		if (selectedRecipe) {
			onSelectRecipe(selectedRecipe)
			selectedRecipe = null
			onClose()
		}
	}

	function handleClose() {
		selectedRecipe = null
		onClose()
	}

	function getRelativeTime(dateStr: string): string {
		const now = Date.now()
		const date = new Date(dateStr).getTime()
		const diffMs = now - date
		const diffMin = Math.floor(diffMs / 60000)
		if (diffMin < 1) return 'Akkurat no'
		if (diffMin < 60) return `${diffMin} min sidan`
		const diffHours = Math.floor(diffMin / 60)
		if (diffHours < 24) return `${diffHours} t sidan`
		const diffDays = Math.floor(diffHours / 24)
		return `${diffDays} d sidan`
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
			style="max-height: 85vh"
		>
			<!-- Drag handle -->
			<div class="flex justify-center pt-3 pb-1 sm:hidden">
				<div class="w-10 h-1 bg-gray-200 rounded-full"></div>
			</div>

			<!-- Header -->
			<div class="flex items-center px-6 py-4 border-b border-purple-100">
				{#if selectedRecipe}
					<button class="p-1 mr-2 rounded-xl hover:bg-purple-50 transition-colors" onclick={handleReturn}>
						<ArrowLeft class="h-5 w-5 text-purple-600" />
					</button>
					<h2 class="text-xl font-black truncate text-gray-900">{selectedRecipe.tittel}</h2>
				{:else}
					<img src="/piknik/idle-mushroom.gif" alt="Historikk" class="w-8 h-8 object-contain mr-2" />
					<h2 class="text-xl font-black text-gray-900">Oppskrifthistorikk</h2>
				{/if}
				<button class="p-2 rounded-full hover:bg-purple-50 ml-auto transition-colors" onclick={handleClose}>
					✕
				</button>
			</div>

			<!-- Tabs -->
			{#if !selectedRecipe}
				<div class="flex px-6 pt-3 gap-2">
					<button
						class="flex-1 py-2 rounded-xl text-[14px] font-bold transition-colors {activeTab === 'session' ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-500'}"
						onclick={() => (activeTab = 'session')}
					>
						Denne okta
					</button>
					<button
						class="flex-1 py-2 rounded-xl text-[14px] font-bold transition-colors {activeTab === 'community' ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-500'}"
						onclick={() => (activeTab = 'community')}
					>
						Alle oppskrifter
					</button>
				</div>
			{/if}

			<!-- Content -->
			<div class="px-6 py-4 overflow-y-auto" style="max-height: calc(85vh - {selectedRecipe ? '80px' : '130px'})">
				{#if selectedRecipe}
					<p class="text-sm text-purple-500 font-medium mb-2">
						{getRelativeTime(selectedRecipe.dato)}
					</p>
					<p class="text-[16px] text-gray-700 font-medium mb-5">{selectedRecipe.skildring}</p>

					<h4 class="text-[14px] font-black uppercase tracking-wider text-purple-600 mb-3">Ingrediensar</h4>
					<div class="grid grid-cols-2 gap-2 mb-5">
						{#each selectedRecipe.ingrediensar as ingrediens}
							<div class="bg-purple-50 rounded-xl p-3">
								<span class="text-sm font-medium">{ingrediens.namn}</span>
								<span class="text-xs text-purple-500 block">{ingrediens.mengde} {ingrediens.eining}</span>
							</div>
						{/each}
					</div>

					<h4 class="text-[14px] font-black uppercase tracking-wider text-purple-600 mb-3">Framgangsmåte</h4>
					<ol class="space-y-3 mb-5">
						{#each selectedRecipe.steg as steg, i}
							<li class="flex gap-3">
								<span class="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
									{i + 1}
								</span>
								<span class="text-sm leading-relaxed pt-0.5">{steg}</span>
							</li>
						{/each}
					</ol>

					<button
						class="w-full py-3.5 rounded-2xl bg-piknik-gradient text-white font-extrabold text-[16px] transition-all"
						onclick={handleUseRecipe}
					>
						Bruk denne oppskrifta
					</button>
				{:else if recipes.length === 0}
					<div class="flex flex-col items-center justify-center py-10 gap-3">
						<img src="/piknik/sleep-a.gif" alt="Ingen oppskrifter" class="w-48 h-48 object-contain mascot-float" />
						<p class="text-[15px] font-medium text-gray-400">
							{activeTab === 'session' ? 'Ingen oppskrifter i denne okta' : 'Ingen oppskrifter enno'}
						</p>
					</div>
				{:else}
					<div class="space-y-2.5">
						{#each recipes as recipe, i}
							<button
								type="button"
								class="w-full p-4 bg-white border-2 border-purple-100 rounded-2xl transition-all flex items-center gap-3 text-left tap-feedback ingredient-enter"
								style="animation-delay: {i * 60}ms"
								onclick={() => handleSelectRecipe(recipe)}
							>
								<div class="w-1 h-10 rounded-full bg-piknik-gradient flex-shrink-0"></div>
								<div class="min-w-0 flex-1">
									<h3 class="font-extrabold text-[16px] mb-0.5 truncate text-gray-900">{recipe.tittel}</h3>
									<p class="text-[13px] text-purple-500 font-semibold">{getRelativeTime(recipe.dato)}</p>
								</div>
								<ChevronRight class="h-4 w-4 text-purple-400 flex-shrink-0" />
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
