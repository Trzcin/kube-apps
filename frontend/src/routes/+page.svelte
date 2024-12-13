<script lang="ts">
	import { baseApiUrl } from '$lib/api';
	import AddTodo from '$lib/components/AddTodo.svelte';
	import TodoItem from '$lib/components/TodoItem.svelte';
	import { onMount } from 'svelte';

	let todos: Todo[] = $state([]);
	onMount(async () => {
		const res = await fetch(`${baseApiUrl}api/todos`);
		todos = await res.json();
	});
</script>

<main class="flex h-screen flex-col items-center pt-16">
	<h1 class="text-4xl font-bold text-blue-500">Kube Todo</h1>
	<ul class="mt-4">
		{#each todos as todo (todo.id)}
			<TodoItem {todo} oncheck={(v) => (todo.checked = v)} />
		{/each}
	</ul>
	<div class="mt-4">
		<AddTodo onadd={(todo) => todos.push(todo)} />
	</div>
</main>
