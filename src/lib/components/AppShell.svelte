<script lang="ts">
	import type { Snippet } from 'svelte'

	let { children }: { children: Snippet } = $props()
</script>

<div class="w-full h-[100dvh] bg-piknik-gradient-subtle flex flex-col relative overflow-hidden">
	{@render children()}
</div>
