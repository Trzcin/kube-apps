<script lang="ts">
	let { children, label } = $props();
	let expanded = $state(false);
</script>

<button
	class="flex h-fit max-h-60 flex-col items-center gap-2 overflow-auto rounded bg-gray-200 px-3 py-1 text-left shadow-md shadow-gray-300"
	onclick={() => (expanded = !expanded)}
>
	{@render label()}
	{#if expanded}
		{@render children()}
	{/if}
</button>
