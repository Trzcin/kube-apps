import { createClient } from "redis";

let cache: ReturnType<typeof createClient> | undefined;

async function setupCache() {
    const client = createClient({
        url: `redis://${process.env.REDIS_HOST ?? "localhost"}:6379`,
    });
    client.on("error", (err) => {
        console.error("Redis error: ", err);
        cache = undefined;
        setTimeout(setupCache, 1000);
    });
    await client.connect();
    cache = client;
}
setupCache();

async function getTodos(userId: string): Promise<Todo[] | null> {
    if (!cache) return null;

    try {
        const todos = (await cache.json.get(userId)) as Todo[] | null;
        return todos;
    } catch (error) {
        console.error("Redis error", error);
        return null;
    }
}

async function updateTodos(userId: string, update: (todos: Todo[]) => Todo[]) {
    if (!cache) return;

    try {
        const data = ((await cache.json.get(userId)) as Todo[] | null) ?? [];
        await cache.json.set(userId, "$", update(data));
    } catch (error) {
        console.error("Redis error", error);
    }
}

export default { getTodos, updateTodos };
