import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure.input(
    z.object({
        name: z.string(),
        githubUrl: z.string(),
        githubToken: z.string().optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    const project = await ctx.db.project.create({
      data: {
        githubUrl: input.githubUrl,
        name: input.name,
        userProjects: {
            create: {
                userId: ctx.user.userId!,
            },
        },
        },
    });
    return project;
  }),
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.project.findMany({
      where: {
        userProjects: {
          some: {
            userId: ctx.user.userId!,
          },
        },
        deletedAt: null,
      },
    });
  }),
});
