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
    const blogs=await prisma.blog.findMany({select: {
      id: true,
      title: true,
      body: true,
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },})
    return c.json({blogs});
}

export async function handleGetUserBlogs(c:any){
    const blogs=await prisma.blog.findMany({where:{userId:c.req.userId},select: {
      id: true,
      title: true,
      body: true,
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },})
    return c.json({blogs});
}

export async function handlePostPostreq(c:Context) {
  const body: {
    title: string;
    body: string;
    tags: string[];
  } = await c.req.json();
  
  const res = await prisma.blog.create({
    data: {
      title: body.title,
      body: body.body,
      User: { connect: { id: c.req.userId } },
      tags: {
        create: await Promise.all(body.tags.map(async (tag) => {
          const existingTag = await prisma.tag.findUnique({
            where: { name: tag },
          });
  
          if (existingTag) {
            return { tag: { connect: { id: existingTag.id } } };
          } else {
            return { tag: { create: { name: tag } } };
          }
        })),
      },
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
      select: {
        id: true,
        title: true,
        body: true,
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
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
        tags:blog.tags
      },
    });
  }
  export async function handlePutById(c: Context) {
    const id: number = Number(c.req.param("id"));
  
    const body: {
      title?: string;
      body?: string;
      tags?: string[];
    } = await c.req.json();
  
    const blog = await prisma.blog.findFirst({
      where: {
        id: id,
        userId: c.req.userId,
      },
      include: { tags: true },
    });
  
    if (!blog) {
      return c.json({
        message: "No blog with this id",
      });
    }
  
    const updatedBlog = await prisma.blog.update({
      where: {
        id: id,
      },
      data: {
        title: body.title !== undefined ? body.title : blog.title,
        body: body.body !== undefined ? body.body : blog.body,
        tags: {
          create: body.tags
            ?.filter((tag) => typeof tag === 'string' && !blog.tags.some(async (existingTag) => existingTag.tagId === await tagIdFromName(tag)))
            .map((tagName) => ({
              tag: { create: { name: tagName } },
            })) ?? [],
        },
      },
      select: {
        id: true,
        title: true,
        body: true,
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    
    console.log(updatedBlog);
    

    async function tagIdFromName(name:string){
      const res=await prisma.tag.findFirst({where:{name}})
      return res?.id;
    }
  
    return c.json({
      data: {
        title: updatedBlog.title,
        body: updatedBlog.body,
        tags:updatedBlog.tags
      },
    });
  }
  
  
  export async function handlePostDeleteById(c:Context) {
    const id: number = Number(c.req.param("id"));

    const blog = await prisma.blog.findFirst({
      where: {
        id: id,
        userId: c.req.userId,
      },
      include: { tags: true },
    });
  
    if (!blog) {
      return c.json({
        message: "No blog with this id",
      });
    }
  
    const uniqueTags = blog.tags.filter(async (tag) => {
      const associatedBlogsCount = await prisma.tagBlog.count({
        where: {
          tagId: tag.tagId,
          blogId: { not: id },
        },
      });
  
      return associatedBlogsCount === 0;
    });

    await prisma.tagBlog.deleteMany({
      where: {
        blogId: id,
      },
    });
  
    const deletedBlog = await prisma.blog.delete({
      where: {
        id: id,
      },
      include: {
        tags: {
          where: {
            tagId: { in: uniqueTags.map((tag) => tag.tagId) },
          },
        },
      },
    });
  
    return c.json({
      data: {
        message: "Blog deleted successfully.",
        deletedBlog,
      },
    });
  }