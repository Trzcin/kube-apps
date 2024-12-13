<script lang="ts">
    let { onadd }: { onadd?: (todo: Todo) => void } = $props(); 
    let todoText = $state("");
    
    function handleSubmit(ev: SubmitEvent) {
        ev.preventDefault();
        if (todoText.trim().length === 0) return;

        onadd?.({ id: crypto.randomUUID(), text: todoText });
        todoText = "";
    }
</script>

<form class="flex items-center gap-4" onsubmit={handleSubmit}>
    <input class="border border-gray-800 rounded px-3 py-1" spellcheck="false" type="text" placeholder="todo..." bind:value={todoText}>
    <button 
        type="submit"
        class="select-none px-3 py-1 bg-blue-500 border border-blue-500 text-white rounded font-semibold hover:bg-blue-400 hover:border-blue-400 transition-all"
    >
        Add Item
    </button>
</form>