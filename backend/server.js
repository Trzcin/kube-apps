import express from 'express'

const app = express();

const todos = ["todo 1", "todo 2"];
app.get("/api", (_, res) => {
   return res.json(todos); 
});

const port = process.env.PORT ?? 80;
app.listen(port, () => console.log(`Server listening on port ${port}`));