<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { Share2, Plus } from 'lucide-svelte'
	import * as QRCode from 'qrcode'
	import { sessionStore } from '$lib/stores/session.svelte'
	import { ingredientsStore } from '$lib/stores/ingredients.svelte'
	import { recipesStore } from '$lib/stores/recipes.svelte'
	import { audioStore } from '$lib/stores/audio.svelte'
	import { cuisineOptions } from '$lib/data/cuisine-options'
	import AppShell from '$lib/components/AppShell.svelte'
	import IngredientList from '$lib/components/IngredientList.svelte'
	import AddIngredientDialog from '$lib/components/AddIngredientDialog.svelte'
	import RecipeModal from '$lib/components/RecipeModal.svelte'
	import RecipeHistory from '$lib/components/RecipeHistory.svelte'
	import BlendingOverlay from '$lib/components/BlendingOverlay.svelte'
	import UserAvatar from '$lib/components/UserAvatar.svelte'
	import StepIndicator from '$lib/components/StepIndicator.svelte'
	import MascotGuide from '$lib/components/MascotGuide.svelte'
	import type { Oppskrift } from '$lib/types'

	let { data } = $props()

	let showShareDialog = $state(false)
	let showInfo = $state(false)
	let showRecipeHistory = $state(false)
	let showJoinDialog = $state(false)
	let username = $state('')
	let selectedCuisines = $state<string[]>([])
	let isChildFriendly = $state(false)
	let isAdvancedMode = $state(false)
	let qrCodeDataUrl = $state('')

	const shareUrl = $derived(`https://piknik.iverfinne.no/${data.sessionCode}`)

	// Step tracking
	let currentStep = $derived(
		recipesStore.oppskrift ? 3 :
		recipesStore.blandar ? 2 :
		ingredientsStore.valgteIngrediensar.length >= 2 ? 2 :
		1
	)

	// Mascot state machine
	let mascotAnimation = $derived(
		recipesStore.blandar ? 'dance-music' :
		recipesStore.oppskrift ? 'happy-bounce-a' :
		recipesStore.error ? 'walk-steam' :
		ingredientsStore.ingrediensar.length === 0 ? 'sleep-b' :
		ingredientsStore.valgteIngrediensar.length >= 2 ? 'flex-question' :
		ingredientsStore.valgteIngrediensar.length === 1 ? 'idle-stand-a' :
		'sleep-a'
	)

	let mascotMessage = $derived(
		recipesStore.blandar ? 'Blandar oppskrift...' :
		recipesStore.oppskrift ? 'Oppskrifta er klar!' :
		recipesStore.error ? 'Noko gjekk gale...' :
		ingredientsStore.ingrediensar.length === 0 ? 'Legg til ingrediensar!' :
		ingredientsStore.valgteIngrediensar.length >= 2 ? 'Klar til a blande?' :
		ingredientsStore.valgteIngrediensar.length === 1 ? 'Ein til!' :
		'Vel minst 2 ingrediensar!'
	)

	// Generate QR code when share dialog opens
	$effect(() => {
		if (showShareDialog) {
			QRCode.toDataURL(shareUrl, { width: 200, margin: 2 }).then((url: string) => {
				qrCodeDataUrl = url
			})
		}
	})

	// Check if user needs to join
	$effect(() => {
		if (!sessionStore.sessionStarted && data.sessionCode) {
			showJoinDialog = true
		}
	})

	// Start audio and fetch recipe history when session starts
	$effect(() => {
		if (sessionStore.sessionStarted) {
			audioStore.init()
			audioStore.playBackground()
			recipesStore.fetchRecipeHistory()
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
		}
	})

	onDestroy(() => {
		sessionStore.cleanup()
		ingredientsStore.cleanup()
		audioStore.cleanup()
	})

	async function handleJoinWithUsername() {
		if (username && data.sessionCode) {
			await sessionStore.joinSession(username, data.sessionCode)
			showJoinDialog = false
			await ingredientsStore.init(data.sessionCode)
		}
	}

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

	let canBlend = $derived(
		ingredientsStore.valgteIngrediensar.length >= 2 && !recipesStore.blandar
	)
</script>

<!-- Join dialog for new users -->
{#if showJoinDialog && !sessionStore.sessionStarted}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 flex items-center justify-center z-50" style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.95) 0%, rgba(147, 51, 234, 0.9) 100%);">
		<div class="bg-white rounded-3xl p-7 w-full max-w-sm mx-4 page-enter">
			<div class="flex flex-col items-center mb-5">
				<img src="/piknik/walk-baguette-a.gif" alt="Velkomen" class="w-24 h-24 object-contain mascot-enter mb-2" />
				<h2 class="text-2xl font-black text-gray-900">Bli med i okta</h2>
				<p class="text-[15px] text-gray-500 mt-1 font-medium">Nokon inviterte deg til a lage mat!</p>
			</div>
			<input
				type="text"
				bind:value={username}
				placeholder="Skriv inn brukarnamnet ditt"
				class="w-full h-14 px-5 border-2 border-purple-100 rounded-2xl bg-purple-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-[16px] mb-4 transition-all"
				onkeydown={(e) => e.key === 'Enter' && username && handleJoinWithUsername()}
			/>
			<button
				onclick={handleJoinWithUsername}
				disabled={!username}
				class="w-full h-14 rounded-2xl text-white font-extrabold text-[18px] transition-all
					{!username ? 'bg-gray-300 cursor-not-allowed' : 'bg-piknik-gradient active:scale-[0.97]'}"
			>
				Bli med
			</button>
		</div>
	</div>
{/if}

{#if sessionStore.sessionStarted}
	<AppShell>
		<div class="max-w-[390px] mx-auto page-enter">
			<!-- Header -->
			<div class="px-5 pt-4 pb-2 bg-purple-50/80 rounded-b-3xl">
				<div class="flex justify-between items-center">
					<div class="flex items-center gap-2.5">
						<img src="/piknik/idle-mushroom.gif" alt="PikNik" class="w-10 h-10 object-contain rounded-xl" />
						<h1 class="text-[26px] font-black text-purple-700 tracking-tight">PikNik!</h1>
					</div>
					<div class="flex items-center gap-2">
						<div class="flex -space-x-2">
							{#each sessionStore.participants as participant (participant.id)}
								<UserAvatar name={participant.namn} color={participant.farge} />
							{/each}
						</div>
						<button
							class="flex items-center gap-1.5 pl-2.5 pr-3 py-2 rounded-full bg-white tap-feedback text-[14px] font-bold text-purple-600"
							onclick={() => (showShareDialog = true)}
						>
							<Share2 class="w-3.5 h-3.5" />
							Del
						</button>
					</div>
				</div>

				<!-- Step Indicator -->
				<StepIndicator {currentStep} />
			</div>

			<!-- Mascot Guide -->
			<div class="flex justify-center py-3">
				<MascotGuide
					animation={mascotAnimation}
					message={mascotMessage}
					size="sm"
				/>
			</div>

			<!-- Ingredients section -->
			<div class="px-5">
				<div class="flex justify-end mb-3">
					<button
						class="w-10 h-10 flex items-center justify-center rounded-2xl bg-piknik-gradient text-white tap-feedback"
						onclick={() => (ingredientsStore.visLeggTilIngrediens = true)}
					>
						<Plus class="w-5 h-5" />
					</button>
				</div>

				<IngredientList sessionCode={data.sessionCode} />

				{#if recipesStore.error}
					<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-[13px] text-red-600 flex items-center gap-2">
						<img src="/piknik/walk-steam.gif" alt="Feil" class="w-8 h-8 object-contain" />
						{recipesStore.error}
					</div>
				{/if}
			</div>
		</div>

		<!-- Blend button — fixed above bottom bar -->
		<div class="fixed bottom-0 left-0 right-0 px-5 py-4 z-20 safe-bottom">
			<div class="max-w-[390px] mx-auto">
				<button
					onclick={handleBlend}
					disabled={!canBlend}
					class="w-full h-14 rounded-2xl text-white font-extrabold text-[19px] transition-all duration-300
						{canBlend
							? 'bg-piknik-gradient-warm active:scale-[0.97]'
							: 'bg-gray-300 cursor-not-allowed'}"
				>
					{recipesStore.blandar ? 'Blandar...' : `Bland! ${canBlend ? `(${ingredientsStore.valgteIngrediensar.length})` : ''}`}
				</button>
			</div>
		</div>
	</AppShell>

	<!-- Overlays and modals -->
	<BlendingOverlay isBlending={recipesStore.blandar} />

	{#if recipesStore.oppskrift}
		<RecipeModal oppskrift={recipesStore.oppskrift} onClose={() => recipesStore.clearRecipe()} />
	{/if}

	<RecipeHistory
		isOpen={showRecipeHistory}
		onClose={() => (showRecipeHistory = false)}
		onSelectRecipe={(recipe: Oppskrift) => (recipesStore.oppskrift = recipe)}
	/>

	<AddIngredientDialog
		isOpen={ingredientsStore.visLeggTilIngrediens}
		onClose={() => {
			ingredientsStore.visLeggTilIngrediens = false
			ingredientsStore.redigeringIngrediens = null
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
				<!-- Header with mascot -->
				<div class="flex items-center gap-3 px-6 pt-5 pb-3">
					<img src="/piknik/walk-baguette-a.gif" alt="Del" class="w-12 h-12 object-contain" />
					<h2 class="text-xl font-black text-gray-900">Del okt</h2>
					<button class="p-2 rounded-full hover:bg-purple-50 ml-auto" onclick={() => (showShareDialog = false)}>
						✕
					</button>
				</div>

				<div class="px-6 pb-6">
					<!-- Session code -->
					<div class="bg-purple-50 rounded-2xl p-4 mb-4 text-center border-2 border-purple-300">
						<p class="text-5xl font-black tracking-widest text-purple-700">{data.sessionCode}</p>
						<p class="text-[14px] text-purple-500 mt-1 font-bold">Del denne koden</p>
					</div>

					{#if qrCodeDataUrl}
						<div class="flex justify-center mb-4">
							<div class="border-2 border-purple-200 rounded-2xl p-2">
								<img src={qrCodeDataUrl} alt="QR-kode" class="rounded-xl" />
							</div>
						</div>
					{/if}

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
						<h3 class="text-[14px] font-black uppercase tracking-wider text-purple-600 mb-3">Innstillingar</h3>

						<div class="mb-3">
							<h4 class="text-sm font-medium mb-2 text-gray-700">Velg kjokken:</h4>
							<div class="grid grid-cols-2 gap-2">
								{#each cuisineOptions as cuisine}
									<label class="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											checked={selectedCuisines.includes(cuisine)}
											onchange={() => handleCuisineChange(cuisine)}
											class="w-4 h-4 rounded border-purple-300 text-purple-500 focus:ring-purple-500"
										/>
										<span class="text-sm">{cuisine}</span>
									</label>
								{/each}
							</div>
						</div>

						<label class="flex items-center justify-between py-2.5">
							<span class="text-sm font-medium text-gray-700">Barnevennleg oppskrift</span>
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
							<span class="text-sm font-medium text-gray-700">Avansert modus</span>
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

	<!-- Info dialog -->
	{#if showInfo}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 blend-overlay"
			onkeydown={(e) => e.key === 'Escape' && (showInfo = false)}
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div class="absolute inset-0" onclick={() => (showInfo = false)}></div>
			<div
				class="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl bottom-sheet-enter safe-bottom overflow-hidden"
			>
				<div class="flex items-center gap-3 px-6 pt-5 pb-3">
					<img src="/piknik/idle-stand-a.gif" alt="Info" class="w-12 h-12 object-contain" />
					<h2 class="text-xl font-black text-gray-900">Om PikNik</h2>
					<button class="p-2 rounded-full hover:bg-purple-50 ml-auto transition-colors" onclick={() => (showInfo = false)}>
						✕
					</button>
				</div>
				<div class="px-6 pb-6">
					<p class="text-[16px] text-gray-700 mb-4 leading-relaxed font-medium">
						PikNik er ein interaktiv matlagingsapp der brukarar kan samarbeide i sanntid for a lage
						kreative oppskrifter basert pa ingrediensane dei har.
					</p>
					<h3 class="text-[14px] font-black uppercase tracking-wider text-purple-600 mb-3">Slik brukar du PikNik</h3>
					<ol class="space-y-2.5">
						{#each ['Legg til ingrediensar du har tilgjengeleg', 'Vel ingrediensane du vil bruke', 'Trykk pa "Bland!" for a generere oppskrift', 'Del oppskrifta med vennene dine'] as step, i}
							<li class="flex gap-3">
								<span class="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
									{i + 1}
								</span>
								<span class="text-sm leading-relaxed pt-0.5 text-gray-700">{step}</span>
							</li>
						{/each}
					</ol>
				</div>
			</div>
		</div>
	{/if}

{/if}
