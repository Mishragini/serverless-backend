import { z } from "zod";

export const checkUser= z.object({
    username: z.string(),
    email: z.string().email(),
    password: z.string()
})

export const checkInUser= z.object({
    email: z.string().email(),
    password: z.string()
})
