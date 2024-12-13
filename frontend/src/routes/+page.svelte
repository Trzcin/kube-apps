<script lang="ts">
	import AddTodo from '$lib/components/AddTodo.svelte';
	import TodoItem from '$lib/components/TodoItem.svelte';

	const todos: Todo[] = $state([
		{ id: crypto.randomUUID(), text: 'todo item 1' },
		{ id: crypto.randomUUID(), text: 'todo item 2' }
	]);
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
