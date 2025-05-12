// This is a mechanism for defining routes that can be shared between
// server and client

import {z, ZodFormattedError} from "zod"

export type RouteDefs = Record<NonRouteReservedKeys, RouteDefEntry>

export type NonRouteReservedKeys = Exclude<string, RouteReservedKeys>
export type RouteReservedKeys = ":hb:type" | ":hb:prefix"
export type RouteDefEntry = RouteDef | GroupRouteDef<any>

export type GroupRouteDef<T extends RouteDefs> = T & {
  ":hb:type": "Group"
  ":hb:prefix": string
}

export type RouteDef<T extends RouteSchema = RouteSchema> = T & {
  ":hb:type": "Route"
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
  [K in keyof T as K extends RouteReservedKeys ? never : K]: RouteEntryToInterface<T[K]>
};

// export type RoutesInterface<T extends RouteDefs> = {
//   [K in keyof T as K extends RouteReservedKeys ? never : K]:
//     T[K] extends { ":hb:type": "Group", ":hb:prefix": string }
//       ? RoutesInterface<T[K]>
//       : T[K] extends { ":hb:type": "Route" }
//         ? RouteFunction<T[K]>
//         : never;
// }

export type RouteEntryToInterface<V> =
  V extends { ":hb:type": "Route"; method: RouteMethod; path: string }
    ? RouteFunction<V>
    : V extends { ":hb:type": "Group"; ":hb:prefix": string }
      ? RoutesInterface<V>
      : never;

export type RouteFunction<R extends RouteDef> = (
  req: RequestType<R>
) => Promise<ResponseType<R>>

export type RequestType<T extends RouteDef> = T["request"] extends z.ZodTypeAny
  ? z.infer<T["request"]>
  : void
export type ResponseType<T extends RouteDef> =
  T["response"] extends z.ZodTypeAny ? z.infer<T["response"]> : void

export const routes = {
  group: <T extends RouteDefs>(prefix: string, routes: T): GroupRouteDef<T> => {
    return {
      ":hb:type": "Group",
      ":hb:prefix": prefix,
      ...routes
    }
  },

  get: <T extends RouteSchema = {}>(path: string, schema?: T): RouteDef<T> => {
    return {
      ":hb:type": "Route",
      method: "GET",
      path,
      ...(schema || ({} as T)),
    }
  },

  post: <T extends RouteSchema = {}>(path: string, schema?: T): RouteDef<T> => {
    return {
      ":hb:type": "Route",
      method: "POST",
      path,
      ...(schema || ({} as T)),
    }
  },
}
