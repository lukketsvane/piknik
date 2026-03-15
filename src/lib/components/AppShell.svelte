<script lang="ts">
	import type { Snippet } from 'svelte'

	let { children }: { children: Snippet } = $props()
</script>

<div class="w-full h-[100dvh] bg-piknik-gradient-subtle flex flex-col overflow-hidden">
	<div class="flex-grow flex flex-col overflow-hidden">
		{@render children()}
	</div>
</div>
