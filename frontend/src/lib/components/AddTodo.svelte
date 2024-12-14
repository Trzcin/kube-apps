<script lang="ts">
	import { userId } from '$lib/store';

	let { onadd }: { onadd?: (todo: TodoPost) => void } = $props();
	let todoText = $state('');

	function handleSubmit(ev: SubmitEvent) {
		ev.preventDefault();
		if (todoText.trim().length === 0) return;

		if ($userId) {
			onadd?.({ userId: $userId, content: todoText });
		}
		todoText = '';
	}
</script>

<form class="flex items-center gap-4" onsubmit={handleSubmit}>
	<input
		class="rounded border border-gray-800 px-3 py-1"
		spellcheck="false"
		type="text"
		placeholder="todo..."
		bind:value={todoText}
	/>
	<button
		type="submit"
		class="select-none rounded border border-blue-500 bg-blue-500 px-3 py-1 font-semibold text-white transition-all hover:border-blue-400 hover:bg-blue-400"
	>
		Add Item
	</button>
</form>
