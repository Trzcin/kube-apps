<script lang="ts">
	let { todo, oncheck }: { todo: Todo; oncheck?: (value: boolean) => void } = $props();
</script>

<li>
	<div class="flex items-center gap-2">
		<input
			class="accent-blue-500"
			type="checkbox"
			name="todo{todo.id}"
			id="todo{todo.id}"
			onchange={(ev) => oncheck?.(ev.currentTarget.checked)}
		/>
		<label
			class="select-none text-lg {todo.checked && 'text-gray-400 line-through'}"
			for="todo{todo.id}">{todo.content}</label
		>
	</div>
</li>
