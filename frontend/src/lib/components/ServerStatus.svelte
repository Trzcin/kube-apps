<script lang="ts">
	import { baseApiUrl } from '$lib/api';
	import { onMount } from 'svelte';

	const pingIntervalMs = 1000;
	const reconnectTimeoutMs = 1000;

	let status = $state<'connecting' | 'online' | 'offline'>('connecting');
	let pingInterval = $state<number | undefined>();
	let logs = $state<{ date: Date; msg: string }[]>([]);
	let showLogs = $state(false);
	let pongRecived = false;
	let lostConnection = false;

	function openSocket() {
		clearInterval(pingInterval);
		pongRecived = false;

		if (!lostConnection) {
			logs.push({ date: new Date(), msg: 'Connecting to server' });
		}

		const ws = new WebSocket(`${baseApiUrl}api/ws/`);
		ws.addEventListener('close', () => {
			status = 'offline';
			if (!lostConnection) {
				logs.push({ date: new Date(), msg: 'Connection closed' });
				lostConnection = true;
			}
			setTimeout(openSocket, reconnectTimeoutMs);
		});
		ws.addEventListener('error', () => {
			status = 'offline';
			if (!lostConnection) {
				logs.push({ date: new Date(), msg: 'Fatal socket error' });
			}
			console.error('Socket closed due to error');
		});
		ws.addEventListener('open', () => {
			status = 'online';
			logs.push({ date: new Date(), msg: 'Connection online' });
			lostConnection = false;
			ws.send('ping');
			pingInterval = setInterval(() => {
				if (!pongRecived) {
					status = 'offline';
					logs.push({ date: new Date(), msg: 'Connection offline' });
				}
				ws.send('ping');
				pongRecived = false;
			}, pingIntervalMs);
		});
		ws.addEventListener('message', (ev) => {
			if (typeof ev.data !== 'string' || ev.data !== 'pong') return;
			pongRecived = true;
			status = 'online';
		});
	}

	onMount(openSocket);
</script>

<button
	class="absolute bottom-4 left-1/2 flex max-h-60 -translate-x-1/2 flex-col items-center gap-2 overflow-auto rounded bg-gray-200 px-3 py-1 text-left shadow-md shadow-gray-300"
	onclick={() => (showLogs = !showLogs)}
>
	<div class="flex items-center gap-2">
		<span
			class="h-3 w-3 rounded-full"
			class:bg-blue-500={status === 'connecting'}
			class:bg-green-500={status === 'online'}
			class:bg-red-500={status == 'offline'}
		></span>
		<p class="text-lg font-semibold">
			{#if status === 'connecting'}
				Connecting to server...
			{:else if status === 'online'}
				Server online
			{:else}
				Server offline
			{/if}
		</p>
	</div>
	{#if showLogs}
		<ul>
			{#each logs as log}
				<li class="flex items-center gap-2">
					<span class="font-mono font-semibold">{log.date.toLocaleTimeString('pl-PL')}</span><span
						>{log.msg}</span
					>
				</li>
			{/each}
		</ul>
	{/if}
</button>
