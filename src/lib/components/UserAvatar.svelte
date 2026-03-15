<script lang="ts">
	let { name, color }: { name: string; color: string } = $props()
</script>

<div
	class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white"
	style="background-color: {color}"
>
	{name.charAt(0).toUpperCase()}
</div>
