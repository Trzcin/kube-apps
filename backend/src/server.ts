import express, { Router } from "express";
import expressWs from "express-ws";
import pg from "pg";
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
    if (!userId) {
        res.status(400).send("Missing userId query param");
        return;
    }

    try {
        const result = await db.query<Todo>(
            "SELECT * FROM todo WHERE userId = $1",
            [userId]
        );
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
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).send(`Server error: ${error}`);
    }
});

apiRouter.patch("/todo/:id", async (req, res) => {
    if (!req.body.checked) {
        res.status(400).send("Missing checked in body");
        return;
    }

    try {
        await db.query<Todo>("UPDATE todo SET checked = $1 WHERE id = $2", [
            req.body.checked,
            req.params.id,
        ]);
        res.status(204).end();
    } catch (error) {
        res.status(500).send(`Server error: ${error}`);
    }
});

apiRouter.delete("/todo/:id", async (req, res) => {
    try {
        await db.query<Todo>("DELETE FROM todo WHERE id = $1", [req.params.id]);
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
