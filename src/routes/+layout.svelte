<script lang="ts">
	import '../app.css'

	let { children } = $props()
</script>

<svelte:head>
	<title>PikNik | Kreativ matlagingsapp</title>
</svelte:head>

{@render children()}
