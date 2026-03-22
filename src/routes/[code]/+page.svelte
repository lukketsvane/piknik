<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { Plus, Camera } from 'lucide-svelte'
	import * as QRCode from 'qrcode'
	import { sessionStore } from '$lib/stores/session.svelte'
	import { ingredientsStore } from '$lib/stores/ingredients.svelte'
	import { recipesStore } from '$lib/stores/recipes.svelte'
	import { audioStore } from '$lib/stores/audio.svelte'
	import { cuisineOptions } from '$lib/data/cuisine-options'
	import { generateUsername } from '$lib/data/random-names'
	import AppShell from '$lib/components/AppShell.svelte'
	import IngredientList from '$lib/components/IngredientList.svelte'
	import AddIngredientDialog from '$lib/components/AddIngredientDialog.svelte'
	import RecipeModal from '$lib/components/RecipeModal.svelte'
	import BlendingOverlay from '$lib/components/BlendingOverlay.svelte'
	import UserAvatar from '$lib/components/UserAvatar.svelte'
	import StepIndicator from '$lib/components/StepIndicator.svelte'
	import MascotGuide from '$lib/components/MascotGuide.svelte'
	import RecipeHistory from '$lib/components/RecipeHistory.svelte'

	let { data } = $props()

	let showShareDialog = $state(false)
	let selectedCuisines = $state<string[]>([])
	let isChildFriendly = $state(false)
	let isAdvancedMode = $state(false)
	let qrCodeDataUrl = $state('')
	let identifyingIngredient = $state(false)
	let hasJoined = $state(false)
	let showHistory = $state(false)

	let cameraInput: HTMLInputElement

	const shareUrl = $derived(`https://piknik.iverfinne.no/${data.sessionCode}`)

	// Step tracking — simplified
	let currentStep = $derived(
		recipesStore.oppskrift ? 3 :
		ingredientsStore.valgteIngrediensar.length >= 2 ? 2 :
		1
	)

	// Mascot state machine — sleeps until ready
	let mascotAnimation = $derived(
		identifyingIngredient ? 'run-fast' :
		recipesStore.blandar ? 'dance-music' :
		recipesStore.oppskrift ? 'happy-bounce-a' :
		recipesStore.error ? 'walk-steam' :
		ingredientsStore.valgteIngrediensar.length >= 2 ? 'flex-question' :
		'sleep-a'
	)

	let mascotMessage = $derived(
		identifyingIngredient ? 'Ser...' :
		recipesStore.blandar ? '' :
		recipesStore.oppskrift ? '' :
		recipesStore.error ? 'Oops!' :
		ingredientsStore.valgteIngrediensar.length >= 2 ? 'Dobbelttrykk!' :
		''
	)

	// Double-tap mascot to blend
	let lastTap = $state(0)
	function handleMascotTap() {
		const now = Date.now()
		if (now - lastTap < 400 && canBlend) {
			handleBlend()
		}
		lastTap = now
	}

	// Generate QR code when share dialog opens
	$effect(() => {
		if (showShareDialog) {
			QRCode.toDataURL(shareUrl, { width: 300, margin: 2 }).then((url: string) => {
				qrCodeDataUrl = url
			})
		}
	})

	// Start audio and fetch recipe history when session starts
	$effect(() => {
		if (sessionStore.sessionStarted) {
			audioStore.init()
			audioStore.playBackground()
			recipesStore.fetchRecipeHistory()
			recipesStore.fetchSessionRecipes(data.sessionCode)
		}
	})

	// Handle blending audio
	$effect(() => {
		if (recipesStore.blandar) {
			audioStore.playBlending()
		} else {
			audioStore.stopBlending()
		}
	})

	onMount(async () => {
		sessionStore.initFromCode(data.sessionCode)
		if (sessionStore.sessionStarted) {
			await ingredientsStore.init(data.sessionCode)
		} else if (!hasJoined) {
			hasJoined = true
			const name = generateUsername()
			await sessionStore.joinSession(name, data.sessionCode)
			await ingredientsStore.init(data.sessionCode)
		}
	})

	onDestroy(() => {
		sessionStore.cleanup()
		ingredientsStore.cleanup()
		audioStore.cleanup()
	})

	async function handleBlend() {
		await recipesStore.generateRecipe(
			data.sessionCode,
			selectedCuisines,
			isChildFriendly,
			isAdvancedMode
		)
	}

	function handleCuisineChange(cuisine: string) {
		if (selectedCuisines.includes(cuisine)) {
			selectedCuisines = selectedCuisines.filter((c) => c !== cuisine)
		} else {
			selectedCuisines = [...selectedCuisines, cuisine]
		}
	}

	async function handleQuit() {
		audioStore.stopBackground()
		audioStore.stopBlending()
		ingredientsStore.cleanup()
		await sessionStore.stopSession()
	}

	async function handleCameraCapture(e: Event) {
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return

		identifyingIngredient = true

		try {
			const base64 = await fileToBase64(file)

			const response = await fetch('/api/identify-ingredient', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ image: base64 })
			})

			if (!response.ok) throw new Error('Failed to identify')

			const ingredient = await response.json()

			await ingredientsStore.addIngredient(
				{
					namn: ingredient.namn,
					mengde: ingredient.mengde,
					eining: ingredient.eining,
					kategori: ingredient.kategori,
					bilde: '',
					brukar: null
				},
				data.sessionCode
			)
		} catch (err) {
			console.error('Error identifying ingredient:', err)
		} finally {
			identifyingIngredient = false
			input.value = ''
		}
	}

	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result as string)
			reader.onerror = reject
			reader.readAsDataURL(file)
		})
	}

	let canBlend = $derived(
		ingredientsStore.valgteIngrediensar.length >= 2 && !recipesStore.blandar
	)
</script>

{#if sessionStore.sessionStarted}
	<AppShell>
		<!-- Header -->
		<div class="px-5 pt-4 pb-2 bg-purple-50/80 rounded-b-3xl flex-shrink-0">
			<div class="flex justify-between items-center">
				<button
					class="tap-feedback"
					onclick={() => (showShareDialog = true)}
				>
					<h1 class="text-[26px] font-black text-purple-700 tracking-tight">PikNik!</h1>
				</button>
				<div class="flex -space-x-2">
					{#each sessionStore.participants as participant (participant.id)}
						<UserAvatar name={participant.namn} color={participant.farge} />
					{/each}
				</div>
			</div>

			<!-- Step Indicator -->
			<StepIndicator {currentStep} />
		</div>

		<!-- Mascot Guide — fills middle area, double-tap to blend -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="flex-1 flex items-center justify-center min-h-0 {canBlend ? 'cursor-pointer' : ''}" onclick={handleMascotTap}>
			<MascotGuide
				animation={mascotAnimation}
				message={mascotMessage}
				size="sm"
			/>
		</div>

		<!-- FAB buttons — floating above ingredient list -->
		<div class="flex justify-end gap-2 px-5 mb-2 flex-shrink-0">
			<input
				type="file"
				accept="image/*"
				capture="environment"
				class="hidden"
				bind:this={cameraInput}
				onchange={handleCameraCapture}
			/>
			<button
				class="w-12 h-12 flex items-center justify-center rounded-2xl text-white tap-feedback transition-all
					{identifyingIngredient ? 'bg-orange-500 animate-gentle-pulse' : 'bg-orange-500'}"
				onclick={() => cameraInput.click()}
				disabled={identifyingIngredient}
			>
				<Camera class="w-5 h-5" />
			</button>
			<button
				class="w-12 h-12 flex items-center justify-center rounded-2xl bg-piknik-gradient text-white tap-feedback"
				onclick={() => (ingredientsStore.visLeggTilIngrediens = true)}
			>
				<Plus class="w-5 h-5" />
			</button>
		</div>

		<!-- Ingredients section — scrollable, bottom-aligned -->
		<div class="px-5 pb-16 flex-shrink-0 max-h-[40%] overflow-y-auto scroll-area">
			<IngredientList sessionCode={data.sessionCode} />

			{#if recipesStore.error}
				<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-[14px] font-semibold text-red-600 flex items-center gap-2">
					{recipesStore.error}
				</div>
			{/if}
		</div>

	</AppShell>

	<!-- Overlays and modals -->
	<BlendingOverlay isBlending={recipesStore.blandar} />

	{#if recipesStore.oppskrift}
		<RecipeModal oppskrift={recipesStore.oppskrift} onClose={() => recipesStore.clearRecipe()} />
	{/if}

	<AddIngredientDialog
		isOpen={ingredientsStore.visLeggTilIngrediens}
		onClose={() => {
			ingredientsStore.visLeggTilIngrediens = false
			ingredientsStore.redigeringIngrediens = null
		}}
		sessionCode={data.sessionCode}
	/>

	<RecipeHistory
		isOpen={showHistory}
		onClose={() => (showHistory = false)}
		onSelectRecipe={(recipe) => {
			recipesStore.oppskrift = recipe
		}}
		sessionCode={data.sessionCode}
	/>

	<!-- Share dialog -->
	{#if showShareDialog}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 blend-overlay"
			onkeydown={(e) => e.key === 'Escape' && (showShareDialog = false)}
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div class="absolute inset-0" onclick={() => (showShareDialog = false)}></div>
			<div
				class="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl bottom-sheet-enter safe-bottom overflow-hidden"
			>
				<div class="flex items-center px-6 pt-5 pb-3">
					<button class="p-2 rounded-full hover:bg-purple-50 ml-auto" onclick={() => (showShareDialog = false)}>
						✕
					</button>
				</div>

				<div class="px-6 pb-6">
					{#if qrCodeDataUrl}
						<div class="flex justify-center mb-3">
							<div class="border-2 border-purple-200 rounded-2xl p-3">
								<img src={qrCodeDataUrl} alt="QR-kode" class="rounded-xl w-56 h-56" />
							</div>
						</div>
					{/if}

					<p class="text-center text-[15px] font-bold tracking-[0.3em] text-purple-400 mb-3">{data.sessionCode}</p>

					<p class="text-center mb-5">
						<a
							href={shareUrl}
							class="text-purple-500 hover:underline text-sm font-medium"
							target="_blank"
							rel="noopener noreferrer"
						>
							{shareUrl}
						</a>
					</p>

					<!-- Settings section -->
					<div class="border-t border-purple-100 pt-4">
						<div class="mb-3">
							<h4 class="text-[14px] font-black uppercase tracking-wider text-purple-600 mb-2">Kjøkken</h4>
							<div class="grid grid-cols-2 gap-2">
								{#each cuisineOptions as cuisine}
									<label class="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											checked={selectedCuisines.includes(cuisine)}
											onchange={() => handleCuisineChange(cuisine)}
											class="w-4 h-4 rounded border-purple-300 text-purple-500 focus:ring-purple-500"
										/>
										<span class="text-[14px] font-medium">{cuisine}</span>
									</label>
								{/each}
							</div>
						</div>

						<label class="flex items-center justify-between py-2.5">
							<span class="text-[15px] font-semibold text-gray-700">Barnevennleg</span>
							<button
								type="button"
								role="switch"
								aria-checked={isChildFriendly}
								aria-label="Barnevennleg oppskrift"
								class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors {isChildFriendly ? 'bg-purple-500' : 'bg-gray-300'}"
								onclick={() => (isChildFriendly = !isChildFriendly)}
							>
								<span
									class="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform {isChildFriendly ? 'translate-x-6' : 'translate-x-1'}"
								></span>
							</button>
						</label>

						<label class="flex items-center justify-between py-2.5">
							<span class="text-[15px] font-semibold text-gray-700">Avansert</span>
							<button
								type="button"
								role="switch"
								aria-checked={isAdvancedMode}
								aria-label="Avansert modus"
								class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors {isAdvancedMode ? 'bg-purple-500' : 'bg-gray-300'}"
								onclick={() => (isAdvancedMode = !isAdvancedMode)}
							>
								<span
									class="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform {isAdvancedMode ? 'translate-x-6' : 'translate-x-1'}"
								></span>
							</button>
						</label>
					</div>

					<button
						class="w-full mt-4 py-3.5 rounded-2xl bg-red-500 text-white font-extrabold text-[16px] hover:bg-red-600 transition-all"
						onclick={handleQuit}
					>
						Avslutt okt
					</button>
				</div>
			</div>
		</div>
	{/if}

{/if}
