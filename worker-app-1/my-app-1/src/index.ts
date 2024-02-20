import { Hono } from 'hono'
import { router } from './router/user';
const app = new Hono()

app.route("/app/v1/user", router);

export default app;
