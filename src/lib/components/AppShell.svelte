<script lang="ts">
	import type { Snippet } from 'svelte'

	let { children }: { children: Snippet } = $props()
</script>

<div class="w-full min-h-[100dvh] bg-piknik-gradient-subtle flex flex-col">
	<div class="flex-grow overflow-y-auto scroll-ios pb-24">
		{@render children()}
	</div>
</div>
