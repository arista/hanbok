// This is a mechanism for defining routes that can be shared between
// server and client

import {z, ZodFormattedError} from "zod"

export const GROUP_ROUTE = Symbol("GROUP_ROUTE")

export type RouteDefs = {
  [key: string]: RouteDef | RouteDefs
  [GROUP_ROUTE]?: GroupRouteMetadata
}

export type GroupRouteDef<T extends RouteDefs = RouteDefs> = T & {
  [GROUP_ROUTE]: GroupRouteMetadata
}

export type GroupRouteMetadata = {
  prefix: string
}

export type RouteDef<T extends RouteSchema = RouteSchema> = T & {
  method: RouteMethod
  path: string
}

export type RouteSchema = {
  // The request should be an object {params, query, headers, body}
  request?: z.ZodTypeAny
  response?: z.ZodTypeAny
}

export type RouteMethod = "GET" | "POST"

export function defineRoutes<T extends RouteDefs>(routesDef: T): T {
  return routesDef
}

// This generates a type from an RouteDefs equivalent to:
//
// interface {
//   routeName(req: RequestType) => Promise<ResponseType>
//   groupRouteName: interface {...}
// }
//
// The request type is just the params, query, headers, and body types
// all combined into a single structure

export type RoutesInterface<T extends RouteDefs> = {
  [K in keyof T as K extends typeof GROUP_ROUTE
    ? never
    : K]: T[K] extends RouteDef
    ? RouteFunction<T[K]>
    : T[K] extends RouteDefs
      ? RoutesInterface<T[K]>
      : never
}

type RouteFunction<R extends RouteDef> = (
  req: RequestType<R>
) => Promise<ResponseType<R>>

export type RequestType<T extends RouteDef> = T["request"] extends z.ZodTypeAny
  ? z.infer<T["request"]>
  : void
export type ResponseType<T extends RouteDef> =
  T["response"] extends z.ZodTypeAny ? z.infer<T["response"]> : void

export function isGroup(obj: any): obj is GroupRouteDef {
  return obj && typeof obj === "object" && GROUP_ROUTE in obj
}

export function isRoute(obj: any): obj is RouteDef {
  return obj && typeof obj === "object" && !(GROUP_ROUTE in obj)
}

export function getGroupRouteMetadata(
  routeDefs: RouteDefs
): GroupRouteMetadata {
  if (isGroup(routeDefs)) {
    return routeDefs[GROUP_ROUTE]
  } else {
    throw new Error(
      `Assertion failed: routeDefs is not a group (no [GROUP_ROUTE] specified)`
    )
  }
}

export const routes = {
  group: <T extends RouteDefs>(prefix: string, def: T): GroupRouteDef<T> => {
    return {
      ...def,
      [GROUP_ROUTE]: {prefix},
    }
  },

  get: <T extends RouteSchema = {}>(path: string, schema?: T): RouteDef<T> => {
    return {
      method: "GET",
      path,
      ...(schema || ({} as T)),
    }
  },

  post: <T extends RouteSchema = {}>(path: string, schema?: T): RouteDef<T> => {
    return {
      method: "POST",
      path,
      ...(schema || ({} as T)),
    }
  },
}
