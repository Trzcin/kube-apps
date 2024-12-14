import express, { Router } from "express";
import expressWs from "express-ws";
import pg from "pg";
import cache from "./cache";
const { Client } = pg;

const app = express();
expressWs(app);
const apiRouter = Router();
app.use((_, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});
app.use(express.json());

// setup Postgres connection
const db = new Client({
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
    host: process.env.DB_HOST ?? "localhost",
});
await db.connect();

apiRouter.get("/todos", async (req, res) => {
    const userId = req.query.userId;
    if (typeof userId !== "string") {
        res.status(400).send("Missing userId query param");
        return;
    }

    const todos = await cache.getTodos(userId);
    if (todos != null) {
        res.json(todos);
        return;
    }

    try {
        const result = await db.query<Todo>(
            "SELECT * FROM todo WHERE userId = $1",
            [userId]
        );
        await cache.updateTodos(userId, () => result.rows);
        res.json(result.rows);
    } catch (error) {
        res.status(500).send(`Server error: ${error}`);
    }
});

apiRouter.post("/todos", async (req, res) => {
    if (!req.body.userId) {
        res.status(400).send("Missing userId in body");
        return;
    }
    if (!req.body.content) {
        res.status(400).send("Missing content in body");
        return;
    }

    try {
        const result = await db.query<Todo>(
            "INSERT INTO todo(userId, content) VALUES($1, $2) RETURNING *",
            [req.body.userId, req.body.content]
        );
        await cache.updateTodos(req.body.userId, (todos) => [
            ...todos,
            result.rows[0],
        ]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).send(`Server error: ${error}`);
    }
});

apiRouter.patch("/todo/:id", async (req, res) => {
    const userId = req.query.userId;
    if (typeof userId !== "string") {
        res.status(400).send("Missing userId query param");
        return;
    }
    if (req.body.checked === undefined) {
        res.status(400).send("Missing checked in body");
        return;
    }

    try {
        await db.query<Todo>(
            "UPDATE todo SET checked = $1 WHERE id = $2 AND userId = $3",
            [req.body.checked, req.params.id, userId]
        );
        await cache.updateTodos(userId, (todos) =>
            todos.map((t) =>
                t.id === req.params.id ? { ...t, checked: req.body.checked } : t
            )
        );
        res.status(204).end();
    } catch (error) {
        res.status(500).send(`Server error: ${error}`);
    }
});

apiRouter.delete("/todo/:id", async (req, res) => {
    const userId = req.query.userId;
    if (typeof userId !== "string") {
        res.status(400).send("Missing userId query param");
        return;
    }

    try {
        await db.query<Todo>("DELETE FROM todo WHERE id = $1 AND userId = $2", [
            req.params.id,
            userId,
        ]);
        await cache.updateTodos(userId, (todos) =>
            todos.filter((t) => t.id !== req.params.id)
        );
        res.status(204).end();
    } catch (error) {
        res.status(500).send(`Server error: ${error}`);
    }
});

apiRouter.ws("/ws", (ws) => {
    ws.on("message", (data) => {
        const msg = data.toString();
        if (msg === "ping") {
            ws.send("pong");
        }
    });
});

app.use("/api", apiRouter);
const port = process.env.PORT ?? 5000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
