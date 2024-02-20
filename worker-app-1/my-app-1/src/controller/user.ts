import {PrismaClient} from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Jwt } from 'hono/utils/jwt';
import { Context } from 'hono';
import { checkUser,checkInUser } from '../zod/user';

declare module 'hono' {
    interface HonoRequest {
      userId: number;
    }
  }

export const JWT_SECRET="MY$up3r$3cr3t";

const prisma=new PrismaClient({
    datasourceUrl:
    "prisma://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiYjI2YjhmODMtNTA0Zi00ZjdlLWExN2MtOTFjYzAyZWVlMmFkIiwidGVuYW50X2lkIjoiYTg1NTYwYzY1N2Y1YTRmNGJjMjY0MzQzMTE2N2JkYmYxMGE2NWNmZDZkZTY1OGI3NTVhMmQ4YmU3YTI5OGM0NSIsImludGVybmFsX3NlY3JldCI6IjZmMzViNDBkLTUxNWQtNDA0Yi04MDIyLTBmYjg5OWIyYjgzYiJ9.ePWd-Qk9P282j0nqQFRh9jCHrd0rdFYaK2C3Wi6He7c",
}).$extends(withAccelerate());

export async function handleSignupPostreq(c:Context) {
    const body:{username:string,email:string,password:string}=await c.req.json();

    const zodCheck=checkUser.safeParse(body);
    if(!zodCheck.success){
        return c.json({
            msg: "you are sending wrong inputs",
          });
    }
    const isUserExist = await prisma.user.findFirst({
        where: { email: body.email },
      });
    
      if (isUserExist) {
        return c.json({ msg: "email already exist" });
      }
    
      const res = await prisma.user.create({
        data: {
          username: body.username,
          email: body.email,
          password: body.password,
        },
      });
    
      const userId = res.id;
    
      const token = await Jwt.sign(userId, JWT_SECRET);
    
      return c.json({ msg: "User created successfully", token: token });
}

export async function handleSigninPostReq(c:Context){
    const body:{email:string,password:string}=await c.req.json();

    const zodCheck=checkInUser.safeParse(body);
    if(!zodCheck.success){
        return c.json({
            msg: "you are sending wrong inputs",
          });
    }

    const user =await prisma.user.findFirst({where:{email:body.email}});

    if(!user){
        return c.json({message:"user does not exist.Please signup first"})
    }

    if(user.password!==body.password){
        return c.json({message:"Incorrect Password"})
    }
    const userId = user.id;

    const token = await Jwt.sign(userId, JWT_SECRET);
  
    return c.json({
      message: "User logged-In successfully",
      token: token,
    });
}

export async function handleGetBlogs(c:Context){
    const blogs=await prisma.blog.findMany({})
    return c.json({blogs});
}

export async function handleGetUserBlogs(c:any){
    const blogs=await prisma.blog.findMany({where:{userId:c.req.userId}})
    return c.json({blogs});
}

export async function handlePostPostreq(c:Context) {
    const body: {
      title: string;
      body: string;
    } = await c.req.json();
  
    const res = await prisma.blog.create({
      data: {
        title: body.title,
        body: body.body,
        User:{connect:{id:c.req.userId}}
      },
    });
  
    return c.json({
      message: "Posted successfully",
      blogId: res.id,
    });
  }
  export async function handlePostById(c: any) {
    const id: number = parseInt(c.req.param("id"));
  
    const blog = await prisma.blog.findFirst({
      where: {
        id: id,
        userId: c.req.useId,
      },
    });
  
    if (!blog) {
      return c.json({
        message: "there is no blog with this id",
      });
    }
    return c.json({
      data: {
        title: blog.title,
        body: blog.body,
      },
    });
  }
  export async function handlePutById(c:Context) {
    const id: number = Number(c.req.param("id"));
  
    const body: {
      title?: string;
      body?: string;
    } = await c.req.json();
  
    const blog = await prisma.blog.findFirst({
      where: {
        id: id,
        userId: c.req.userId
      },
    });
  
    if (!blog) {
      return c.json({
        message: "no blog with this id",
      });
    }
  
    const res = await prisma.blog.update({
      where: {
        id: id,
        userId: c.req.userId
      },
      data: {
        title: body.title,
        body: body.body,
      },
    });
  
    return c.json({
      data: {
        title: res.title,
        body: res.body,
      },
    });
  }
  
  export async function handlePostDeleteById(c:Context) {
    const id: number = Number(c.req.param("id"));
  
    const blog= await prisma.blog.findFirst({
      where: {
        id: id,
        userId: c.req.userId
      },
    });
  
    if (!blog) {
      return c.json({
        message: "no blog with this id",
      });
    }
  
    const res = await prisma.blog.delete({
      where: {
        id: id,
        userId: c.req.userId
      },
    });
    return c.json({
      message: "post deleted",
    });
  }