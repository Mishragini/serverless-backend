import { Context,Next} from "hono";
import {JWT_SECRET} from "../controller/user"
import { Jwt } from "hono/utils/jwt";

declare module 'hono' {
  interface HonoRequest {
    userId: number;
  }
}

const secretKey=JWT_SECRET;

export async function authMiddleware(c:Context,next:Next){
  const authHeader = c.req.header('authorization');

  if (!authHeader) {
    return c.json({ message: 'Unauthorized: Missing Authorization header' }, 401);
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return c.json({ message: 'Unauthorized: Missing token in Authorization header' }, 401);
  }

  try {
    const decoded = await Jwt.verify(token, secretKey);
  
    c.req.userId = decoded;
    await next();
  } catch (error) {
    return c.json({ message: 'Unauthorized: Invalid token' }, 401);
  }
}