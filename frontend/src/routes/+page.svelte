<script lang="ts">
	import { baseApiUrl, jsonHeaders } from '$lib/api';
	import AddTodo from '$lib/components/AddTodo.svelte';
	import ServerStatus from '$lib/components/ServerStatus.svelte';
	import TodoItem from '$lib/components/TodoItem.svelte';
	import { userId } from '$lib/store';
	import { onMount } from 'svelte';

	let todos: Todo[] = $state([]);
	onMount(async () => {
		$userId = localStorage.getItem('userId');
		userId.subscribe((val) => val && localStorage.setItem('userId', val));
		if (!$userId) {
			$userId = crypto.randomUUID();
		}

		const res = await fetch(`${baseApiUrl}api/todos?userId=${$userId}`);
		todos = await res.json();
	});

	async function addTodo(todo: TodoPost) {
		const res = await fetch(`${baseApiUrl}api/todos`, {
			method: 'POST',
			body: JSON.stringify(todo),
			headers: jsonHeaders
		});
		const todoItem = await res.json();
		todos.push(todoItem);
	}

	async function checkTodo(todo: Todo) {
		await fetch(`${baseApiUrl}api/todo/${todo.id}`, {
			method: 'PATCH',
			body: JSON.stringify({ checked: todo.checked }),
			headers: jsonHeaders
		});
	}

	async function deleteTodo(todo: Todo) {
		const res = await fetch(`${baseApiUrl}api/todo/${todo.id}`, { method: 'DELETE' });
		if (res.ok) {
			todos = todos.filter((t) => t.id !== todo.id);
		}
	}
</script>

<main class="flex h-screen flex-col items-center pt-16">
	<h1 class="text-4xl font-bold text-blue-500">Kube Todo</h1>
	<ul class="mt-4">
		{#each todos as todo (todo.id)}
			<TodoItem
				{todo}
				oncheck={(v) => {
					todo.checked = v;
					checkTodo(todo);
				}}
				ondelete={() => deleteTodo(todo)}
			/>
		{/each}
	</ul>
	<div class="mt-4">
		<AddTodo onadd={addTodo} />
	</div>
</main>
<ServerStatus />
