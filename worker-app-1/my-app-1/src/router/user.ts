import { Context,Hono } from "hono";

import { handleGetBlogs,
         handleGetUserBlogs,
         handlePostById,
         handlePostDeleteById,
         handlePostPostreq,
         handlePutById,
         handleSigninPostReq,
         handleSignupPostreq } 
from "../controller/user";

import { authMiddleware } from "../middleware/authenticate";

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

export const router=new Hono();

router.get("/users", async (c: Context) => {
    const prisma = new PrismaClient({
      datasourceUrl:
        "prisma://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiNmZmN2VlNGMtNWE3NC00ZDg2LTgxMjctNDc1NWVmZGU4ZGYxIiwidGVuYW50X2lkIjoiM2Q4YTJjY2Y0NmIwMGQ1NjlmYzc1ZjA5MzZkZGZhNTg1MWFkOGQ3N2ZlMGI4NDBlMjcyYmFjZDRjZWM0OGU5ZSIsImludGVybmFsX3NlY3JldCI6ImZkNzgxMDJjLWFkNDUtNDIyNS05MGI1LTI0MDZmYWYyNjY1ZCJ9.0aSNcQRuDBBWYhjolk-zIP3tHzoy-QJlPzjUPvBC5tM",
    }).$extends(withAccelerate());
  
    const res=await prisma.user.findMany();
    return c.json({users: res})
  });

router.post('/signup',handleSignupPostreq);
router.post('/signin',handleSigninPostReq);
router.get("/all-blogs", authMiddleware, handleGetBlogs);
router.get("/blogs", authMiddleware, handleGetUserBlogs)
router.post("/create-post", authMiddleware, handlePostPostreq);
router.get("/post/:id", authMiddleware, handlePostById);
router.put("/post/:id", authMiddleware, handlePutById);
router.delete("/post/:id", authMiddleware, handlePostDeleteById)

