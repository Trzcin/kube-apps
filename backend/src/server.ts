import express, { Router } from 'express'
import expressWs from 'express-ws';

const app = express();
expressWs(app);
const apiRouter = Router();
app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const todos: Todo[] = [
   { id: crypto.randomUUID(), text: "todo item 1" },
   { id: crypto.randomUUID(), text: "todo item 2" }
];
apiRouter.get("/todos", (_, res) => {
   res.json(todos); 
});

apiRouter.ws("/ws", (ws) => {
   ws.on('message', (data) => {
      const msg = data.toString();
      if (msg === 'ping') {
         ws.send('pong');
      }
   });
});

app.use("/api", apiRouter);
const port = process.env.PORT ?? 5000;
app.listen(port, () => console.log(`Server listening on port ${port}`));