<script lang="ts">
	import { baseApiUrl, jsonHeaders } from '$lib/api';
	import AddTodo from '$lib/components/AddTodo.svelte';
	import Logs from '$lib/components/Logs.svelte';
	import ServerStatus from '$lib/components/ServerStatus.svelte';
	import TodoItem from '$lib/components/TodoItem.svelte';
	import { logRequest, userId } from '$lib/store';
	import { onMount } from 'svelte';

	let todos: Todo[] = $state([]);
	onMount(async () => {
		$userId = localStorage.getItem('userId');
		userId.subscribe((val) => val && localStorage.setItem('userId', val));
		if (!$userId) {
			$userId = crypto.randomUUID();
		}

		try {
			logRequest('REQUEST GET todos');
			const start = Date.now();
			const res = await fetch(`${baseApiUrl}api/todos?userId=${$userId}`);
			if (!res.ok) throw `Status ${res.status} ${res.statusText}`;
			const data = await res.json();
			logRequest(`RESPONSE GET todos in ${Date.now() - start} ms from ${data.src}`);
			todos = data.todos;
		} catch (error) {
			logRequest(`ERROR GET todos ${error}`);
			console.error(error);
		}
	});

	async function addTodo(todo: TodoPost) {
		try {
			logRequest('REQUEST POST todos');
			const start = Date.now();
			const res = await fetch(`${baseApiUrl}api/todos`, {
				method: 'POST',
				body: JSON.stringify(todo),
				headers: jsonHeaders
			});
			if (!res.ok) throw `Status ${res.status} ${res.statusText}`;
			const todoItem = await res.json();
			todos.push(todoItem);
			logRequest(`RESPONSE POST todos in ${Date.now() - start} ms`);
		} catch (error) {
			logRequest(`ERROR POST todos ${error}`);
			console.error(error);
		}
	}

	async function checkTodo(todo: Todo) {
		try {
			logRequest('REQUEST PATCH todo');
			const start = Date.now();
			const res = await fetch(`${baseApiUrl}api/todo/${todo.id}?userId=${$userId}`, {
				method: 'PATCH',
				body: JSON.stringify({ checked: todo.checked }),
				headers: jsonHeaders
			});
			if (!res.ok) throw `Status ${res.status} ${res.statusText}`;
			logRequest(`RESPONSE PATCH todo in ${Date.now() - start} ms`);
		} catch (error) {
			logRequest(`ERROR PATCH todo ${error}`);
			console.error(error);
		}
	}

	async function deleteTodo(todo: Todo) {
		try {
			logRequest('REQUEST DELETE todos');
			const start = Date.now();
			const res = await fetch(`${baseApiUrl}api/todo/${todo.id}?userId=${$userId}`, {
				method: 'DELETE'
			});
			if (!res.ok) throw `Status ${res.status} ${res.statusText}`;
			if (res.ok) {
				todos = todos.filter((t) => t.id !== todo.id);
				logRequest(`RESPONSE DELETE todo in ${Date.now() - start} ms`);
			}
		} catch (error) {
			logRequest(`ERROR PATCH todo ${error}`);
			console.error(error);
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
<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-end gap-4">
	<ServerStatus />
	<Logs />
</div>
