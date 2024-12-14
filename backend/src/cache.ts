import { createClient } from "redis";

const cache = await createClient({
    url: `redis://${process.env.REDIS_HOST ?? "localhost"}:6379`,
})
    .on("error", (err) => console.error("Redis error: ", err))
    .connect();

async function getTodos(userId: string): Promise<Todo[] | null> {
    try {
        const todos = (await cache.json.get(userId)) as Todo[] | null;
        return todos;
    } catch (error) {
        console.error("Redis error", error);
        return null;
    }
}

async function updateTodos(userId: string, update: (todos: Todo[]) => Todo[]) {
    try {
        const data = ((await cache.json.get(userId)) as Todo[] | null) ?? [];
        await cache.json.set(userId, "$", update(data));
    } catch (error) {
        console.error("Redis error", error);
    }
}

export default { getTodos, updateTodos };
