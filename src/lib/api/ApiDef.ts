import {z, ZodFormattedError} from "zod"

export type ApiDef = Record<string, ApiDefEntry>

export type ApiDefEntry = ApiDefRoute | ApiDefNested

export type ApiDefRoute = {
  method: ApiDefMethod
  path: string
  // The request should be an object {params, query, body}
  request?: z.ZodTypeAny
  response?: z.ZodTypeAny
}

export type ApiDefMethod = "GET" | "POST"

export type ApiDefNested = {
  prefix: string
  api: ApiDef
}

export function defineApi<T extends ApiDef>(apiDef: T): T {
  return apiDef
}

// This generates a type from an ApiDef equivalent to:
//
// interface {
//   routeName(req: RequestType) => Promise<ResponseType>
//   nestedRouteName: interface {...}
// }
//
// The request type is just the params, query, and body types all
// combined into a single structure

export type ApiInterface<T extends ApiDef> = {
  [K in keyof T]: T[K] extends ApiDefRoute
    ? (req: RequestType<T[K]>) => Promise<ResponseType<T[K]>>
    : T[K] extends ApiDefNested
      ? NestedApiType<T[K]>
      : never
}

export type RequestType<T extends ApiDefRoute> = ZodTypeOrEmptyObject<
  T["request"]
>
export type ResponseType<T extends ApiDefRoute> = ZodTypeOrEmptyObject<
  T["response"]
>

type NestedApiType<T extends ApiDefNested> = ApiInterface<T["api"]>

type ZodTypeOrEmptyObject<T> = T extends z.ZodTypeAny ? z.infer<T> : {}
