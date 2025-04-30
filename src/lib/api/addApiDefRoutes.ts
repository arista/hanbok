import type {ApiDef, ApiDefRoute, ApiDefNested} from "./ApiDef"
import type {
  IRouter,
  IRouterRequest,
  IRouterResponse,
  IRouterRequestHandler,
} from "../devenv/IRouter"
import {z} from "zod"
import path from "node:path"

export function addApiDefRoutes({
  router,
  prefix,
  apiDef,
  onRequest,
}: {
  router: IRouter
  prefix: string
  apiDef: ApiDef
  onRequest: (req: ApiDefRequest<any, any>) => Promise<void>
}) {
  function run() {
    addRoutes(prefix, apiDef, [])
  }

  function addRoutes(
    prefix: string,
    apiDef: ApiDef,
    handlerPath: Array<string>
  ) {
    for (const name of Object.keys(apiDef)) {
      const entry = apiDef[name]
      if (entry != null) {
        if (Object.hasOwnProperty("prefix")) {
          const e = entry as ApiDefNested
          addRoutes(path.join(prefix, e.prefix), e.api, [...handlerPath, name])
        } else {
          const e = entry as ApiDefRoute
          addRoute(path.join(prefix, e.path), e, [...handlerPath, name])
        }
      }
    }
  }

  function addRoute(
    path: string,
    apiDef: ApiDefRoute,
    handlerPath: Array<string>
  ) {
    const requestSchema = toFullRequestSchema(apiDef)

    const handler: IRouterRequestHandler = async (
      routerRequest,
      routerResponse
    ) => {
      // Merge the params, query and body
      const {params, query, body} = routerRequest
      const request: Record<string, any> = {
        ...(params ?? {}),
        ...(query ?? {}),
        ...(body instanceof Object ? body : {}),
      }

      const req: ApiDefRequest<any, any> = {
        routerRequest,
        routerResponse,
        request,
        requestSchema,
        handler: async (rootHandler, request) => {
          const f = traverseHandlerPath(rootHandler, handlerPath)
          return await f(request)
        },
      }
    }

    // Register with the router
    switch (apiDef.method) {
      case "GET":
        router.get(path, handler)
        break
      case "POST":
        router.post(path, handler)
        break
    }
  }

  // The request passed to the method is a combination of the path
  // parameters, query parameters, and the body.  Build up the
  // validator for that full request structure
  function toFullRequestSchema(apiDef: ApiDefRoute) {
    const {params, query, body} = apiDef
    let requestSchema: z.ZodTypeAny = z.object({})
    if (params != null) {
      requestSchema = z.intersection(requestSchema, params)
    }
    if (query != null) {
      requestSchema = z.intersection(requestSchema, query)
    }
    if (body != null) {
      requestSchema = z.intersection(requestSchema, body)
    }
    return requestSchema
  }

  function traverseHandlerPath(root: any, path: Array<string>): Function {
    let val = root
    for (const elem of path) {
      if (!(val instanceof Object) || val[elem] == null) {
        throw new Error(
          `Unable to traverse handler path ${JSON.stringify(path)} - cannot find element "${elem}"`
        )
      }
      val = val[elem]
    }
    if (!(val instanceof Function)) {
      throw new Error(
        `Handler path ${JSON.stringify(path)} does not lead to a function`
      )
    }
    return val
  }

  run()
  // extractPathParams(path: string): string[] {
  //   // Match named params like :id, :slug?, :file*, :name(regex)
  //   const paramRegex = /:([a-zA-Z0-9_]+)(?:\([^)]*\))?[\?\*]?/g;
  //   const params: Array<string> = [];
  //   let match;
  //   while ((match = paramRegex.exec(path)) !== null) {
  //     if (match[1] != null) {
  //       params.push(match[1]);
  //     }
  //   }

  //   // Match wildcard * at the end or in isolation
  //   if (/\*/.test(path)) {
  //     params.push("*");
  //   }

  //   return params;
  // }
}

type ApiHandler = any

export type ApiDefRequest<RQ, RS> = {
  routerRequest: IRouterRequest
  routerResponse: IRouterResponse
  request: RQ
  requestSchema: z.ZodTypeAny
  handler: (rootHandler: ApiHandler, request: RQ) => Promise<RS>
}
