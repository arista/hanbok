import {z} from "zod"

export type ApiDef = Record<string, ApiDefEntry>

export type ApiDefEntry = ApiDefRoute | ApiDefNested

export type ApiDefRoute = {
  method: ApiDefMethod
  path: string
  params?: z.ZodTypeAny
  query?: z.ZodTypeAny
  body?: z.ZodTypeAny
  response?: z.ZodTypeAny
}

export type ApiDefMethod = "GET" | "POST"

export type ApiDefNested = {
  prefix: string
  api: ApiDef
}

export function defineApi<T extends ApiDef>(apiDef:T): ApiDef {
  return apiDef
}
