<script lang="ts">
	import { requestLogs } from '$lib/store';
	import Pill from './Pill.svelte';
</script>

{#snippet label()}
	<p class="text-lg font-semibold">Request logs</p>
{/snippet}

<Pill {label}>
	<ul>
		{#each $requestLogs as log}
			<li class="flex items-center gap-2 font-mono">
				<span class="font-semibold">{log.date.toLocaleTimeString('pl-PL')}</span><span
					>{log.msg}</span
				>
			</li>
		{/each}
	</ul>
</Pill>
