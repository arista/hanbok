import {z} from "zod"
import {defineRoutes, RoutesInterface, routes} from "hanbok/routes"
import * as RT from "./RouteTypes"

export const routeDefs = defineRoutes({
  api: routes.group("/api", {
    sampleResource: routes.group("/sampleResource", {
      list: routes.get("/", {
        response: z.object({
          items: RT.SampleResource.ResourceSchema.array(),
        }),
      }),
      create: routes.post("/", {
        request: z.object({
          body: z.object({
            item: z.object({
              name: z.string(),
              age: z.number().optional(),
            }),
          }),
        }),
        response: RT.SampleResource.ResourceItemSchema,
      }),
      delete: routes.post("/:publicId/Delete", {
        request: z.object({
          params: RT.PublicIdSchema,
        }),
        response: z.object({}),
      }),
      get: routes.get("/:publicId", {
        request: z.object({
          params: RT.PublicIdSchema,
        }),
        response: RT.SampleResource.ResourceItemSchema,
      }),
      update: routes.post("/:publicId/Update", {
        request: z.object({
          params: RT.PublicIdSchema,
          body: z.object({
            item: z.object({
              name: z.string().optional(),
              age: z.number().optional(),
            }),
          }),
        }),
        response: RT.SampleResource.ResourceItemSchema,
      }),
    }),
  }),
  pages: routes.group("/", {
    root: routes.get("/"),
    default: routes.get("/*", {
      request: z.object({
        params: z.object({
          "*": z.string(),
        }),
      }),
    }),
  }),
})

export type IRoutes = RoutesInterface<typeof routeDefs>
