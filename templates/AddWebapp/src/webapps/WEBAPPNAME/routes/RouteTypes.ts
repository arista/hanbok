import {z} from "zod"

export const PublicIdSchema = z.object({
  publicId: z.string(),
})

export namespace SampleResource {
  export const ResourceSchema = z.object({
    publicId: z.string(),
    name: z.string(),
    age: z.number().optional().nullable(),
  })
  export type Resource = z.infer<typeof ResourceSchema>
  export const ResourceItemSchema = z.object({
    item: ResourceSchema,
  })
}
