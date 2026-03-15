<script lang="ts">
	import { sessionStore } from '$lib/stores/session.svelte'
	import { generateUsername } from '$lib/data/random-names'

	let sessionCode = $state('')
	let isCreatingSession = $state(true)
	let username = generateUsername()

	async function handleSubmit() {
		if (isCreatingSession) {
			await sessionStore.createSession(username)
		} else {
			await sessionStore.joinSession(username, sessionCode)
		}
	}

	function handleCodeInput(e: Event) {
		const target = e.target as HTMLInputElement
		sessionCode = target.value.replace(/\D/g, '').slice(0, 4)
	}

	let isDisabled = $derived(!isCreatingSession && sessionCode.length !== 4)
</script>

<div class="w-full min-h-[100dvh] flex flex-col items-center justify-center px-5 bg-piknik-gradient relative overflow-hidden">
	<!-- Decorative circles -->
	<div class="absolute top-[-80px] right-[-60px] w-64 h-64 bg-white/5 rounded-full"></div>
	<div class="absolute bottom-[20%] left-[-40px] w-40 h-40 bg-white/5 rounded-full"></div>

	<div class="w-full max-w-[390px] page-enter relative z-10">
		<!-- Title above card -->
		<div class="text-center mb-3">
			<h1 class="text-[44px] font-black text-white tracking-tight">PikNik!</h1>
			<p class="text-[17px] mt-1 text-white/90 leading-snug font-semibold">
				<span class="underline decoration-orange-400 decoration-3 underline-offset-4">Bland</span> ingrediensar,
				<span class="underline decoration-green-400 decoration-3 underline-offset-4">skap</span> oppskrifter,
				<span class="underline decoration-blue-400 decoration-3 underline-offset-4">del</span> med venner!
			</p>
		</div>

		<!-- Mascot area -->
		<div class="flex justify-center mb-4">
			<img
				src="/piknik/walk-groceries-a.gif"
				alt="PikNik maskot"
				class="w-56 h-56 object-contain mascot-float"
			/>
		</div>

		<!-- Card slides up from bottom -->
		<div class="bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden bottom-sheet-enter">
			<!-- Form -->
			<div class="px-6 py-7 space-y-4">
				<div class="flex items-center justify-between">
					<label class="flex items-center gap-3 cursor-pointer py-1">
						<button
							type="button"
							role="switch"
							aria-checked={isCreatingSession}
							aria-label="Bytt mellom lag okt og bli med i okt"
							class="relative inline-flex h-[31px] w-[51px] items-center rounded-full transition-colors duration-200 flex-shrink-0
								{isCreatingSession ? 'bg-purple-500' : 'bg-gray-300'}"
							onclick={() => (isCreatingSession = !isCreatingSession)}
						>
							<span
								class="inline-block h-[27px] w-[27px] transform rounded-full bg-white shadow-sm transition-transform duration-200
									{isCreatingSession ? 'translate-x-[22px]' : 'translate-x-[2px]'}"
							></span>
						</button>
						<span class="text-[18px] font-extrabold text-purple-700">
							{isCreatingSession ? 'Lag okt' : 'Bli med i okt'}
						</span>
					</label>
				</div>

				<!-- Show assigned name -->
				<div class="bg-purple-50 rounded-2xl px-5 py-3 border-2 border-purple-200">
					<p class="text-[12px] font-bold uppercase tracking-wider text-purple-400 mb-0.5">Du er</p>
					<p class="text-[20px] font-black text-purple-700">{username}</p>
				</div>

				{#if !isCreatingSession}
					<input
						type="text"
						value={sessionCode}
						oninput={handleCodeInput}
						placeholder="0000"
						maxlength={4}
						inputmode="numeric"
						class="w-full h-16 px-4 text-[28px] font-black border-2 border-purple-200 rounded-2xl bg-purple-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center tracking-[0.4em] transition-all"
					/>
				{/if}

				<button
					onclick={handleSubmit}
					disabled={isDisabled}
					class="w-full h-14 rounded-2xl text-white text-[18px] font-extrabold transition-all duration-200
						{isDisabled
							? 'bg-gray-300 cursor-not-allowed'
							: 'bg-piknik-gradient active:scale-[0.97]'}"
				>
					{isCreatingSession ? 'Start!' : 'Bli med!'}
				</button>
			</div>
		</div>
	</div>
</div>
