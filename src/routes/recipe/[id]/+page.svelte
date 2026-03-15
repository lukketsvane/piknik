<script lang="ts">
	let { data } = $props()
	const recipe = data.recipe

	const stepColors = [
		'bg-purple-500', 'bg-orange-500', 'bg-emerald-500', 'bg-blue-500',
		'bg-pink-500', 'bg-amber-500', 'bg-teal-500', 'bg-red-500',
		'bg-indigo-500', 'bg-lime-500', 'bg-cyan-500', 'bg-rose-500'
	]
</script>

<svelte:head>
	<title>{recipe.tittel} | PikNik</title>
	<meta name="description" content={recipe.skildring} />
</svelte:head>

<div class="w-full h-full bg-piknik-gradient-subtle overflow-y-auto">
	<!-- Header -->
	<div class="bg-piknik-gradient-card px-5 pt-6 pb-5">
		<p class="text-white/60 text-[13px] font-bold uppercase tracking-wider mb-1">PikNik oppskrift</p>
		<h1 class="text-[28px] font-black text-white leading-tight">{recipe.tittel}</h1>
		<p class="text-white/80 text-[15px] font-medium mt-2">{recipe.skildring}</p>
	</div>

	<div class="px-5 py-5">
		<!-- Ingredients -->
		<div class="flex flex-wrap gap-2 mb-6">
			{#each recipe.ingrediensar as ing}
				<span class="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 rounded-full text-[14px] font-bold text-purple-700">
					{ing.mengde} {ing.eining} {ing.namn}
				</span>
			{/each}
		</div>

		<!-- Steps -->
		<ol class="space-y-4 pb-8">
			{#each recipe.steg as steg, index}
				<li class="flex gap-3">
					<div class="flex-shrink-0 w-8 h-8 rounded-full {stepColors[index % stepColors.length]} text-white text-[14px] font-black flex items-center justify-center">
						{index + 1}
					</div>
					<p class="text-[15px] leading-relaxed text-gray-800 font-medium pt-1">{steg}</p>
				</li>
			{/each}
		</ol>

		<!-- Back to PikNik -->
		<a
			href="/"
			class="block w-full py-3.5 rounded-2xl bg-piknik-gradient text-white font-black text-[17px] text-center transition-all active:scale-[0.97]"
		>
			Lag din eigen!
		</a>
	</div>
</div>
