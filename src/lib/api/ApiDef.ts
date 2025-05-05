import {z, ZodFormattedError} from "zod"

export const API_GROUP = Symbol("API_GROUP")

export type ApiDef = {
  [key: string]: ApiDefRoute | ApiDef
  [API_GROUP]?: ApiGroupMetadata
}

export type GroupApiDef<T extends ApiDef = ApiDef> = T & {
  [API_GROUP]: ApiGroupMetadata
}

export type ApiGroupMetadata = {
  prefix: string
}

export type ApiDefRoute<T extends ApiDefRouteSchema = ApiDefRouteSchema> = T & {
  method: ApiDefMethod
  path: string
}

export type ApiDefRouteSchema = {
  // The request should be an object {params, query, body}
  request?: z.ZodTypeAny
  response?: z.ZodTypeAny
}

export type ApiDefMethod = "GET" | "POST"

export function defineApi<T extends ApiDef>(apiDef: T): T {
  return apiDef
}

// This generates a type from an ApiDef equivalent to:
//
// interface {
//   routeName(req: RequestType) => Promise<ResponseType>
//   groupRouteName: interface {...}
// }
//
// The request type is just the params, query, and body types all
// combined into a single structure

export type ApiInterface<T extends ApiDef> = {
  [K in keyof T as K extends typeof API_GROUP
    ? never
    : K]: T[K] extends ApiDefRoute
    ? ApiRouteFunction<T[K]>
    : T[K] extends ApiDef
      ? ApiInterface<T[K]>
      : never
}

type ApiRouteFunction<R extends ApiDefRoute> = (
  req: RequestType<R>
) => Promise<ResponseType<R>>

export type RequestType<T extends ApiDefRoute> =
  T["request"] extends z.ZodTypeAny ? z.infer<T["request"]> : void
export type ResponseType<T extends ApiDefRoute> =
  T["response"] extends z.ZodTypeAny ? z.infer<T["response"]> : void

export function isGroup(obj: any): obj is GroupApiDef {
  return obj && typeof obj === "object" && API_GROUP in obj
}

export function isRoute(obj: any): obj is ApiDefRoute {
  return obj && typeof obj === "object" && !(API_GROUP in obj)
}

export function getGroupMetadata(apiDef: ApiDef): ApiGroupMetadata {
  if (isGroup(apiDef)) {
    return apiDef[API_GROUP]
  } else {
    throw new Error(
      `Assertion failed: apiDef is not a group (no [API_GROUP] specified)`
    )
  }
}

export const api = {
  group: <T extends ApiDef>(prefix: string, def: T): GroupApiDef<T> => {
    return {
      ...def,
      [API_GROUP]: {prefix},
    }
  },

  get: <T extends ApiDefRouteSchema = {}>(
    path: string,
    schema?: T
  ): ApiDefRoute<T> => {
    return {
      method: "GET",
      path,
      ...(schema || ({} as T)),
    }
  },

  post: <T extends ApiDefRouteSchema = {}>(
    path: string,
    schema?: T
  ): ApiDefRoute<T> => {
    return {
      method: "POST",
      path,
      ...(schema || ({} as T)),
    }
  },
}
