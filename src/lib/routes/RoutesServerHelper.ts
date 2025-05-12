// Helps a server bind routes from a RouteDefs to handler classes and
// methods.
//
// The overall idea is that when the server receives a request for a
// route, it will first create an instance of a "handler" class,
// passing it the request and response.  It will then call a method on
// that class, passing it the typesafe parsed request, then pass back
// the method's return value.
//
// This allows a single handler class to handle multiple routes with
// different methods.  But it also allows that handler class to gather
// functionality that might apply to all of those methods, such as
// authorization checks.
//
// So when a route is bound, it's actually bound to two functions -
// one that produces the handler class instance, and one which invokes
// the appropriate method on that instance.  To make it easier to
// produce the handler class, the RoutesBinder is configured with a
// "handler factory", which is an app-supplied class that should make
// it easy for routes to create handler instances.
//
// Handlers are expected to inherit from RouteHandlerBase

import {
  RouteDefs,
  RouteDef,
  GroupRouteDef,
  RequestType,
} from "./RouteDefs"
import {RouteHandlerBase} from "./RouteHandlerBase"
import type {
  IRouter,
  IRouterRequestHandler,
  IRouterRequestResponse,
} from "./IRouter"
import {z} from "zod"
import path from "node:path"

export class RoutesServerHelper<HF> {
  constructor(
    public props: {
      router: IRouter
      createHandlerFactory: (requestResponse: IRouterRequestResponse) => HF
      prefix: string
    }
  ) {}

  get createHandlerFactory() {
    return this.props.createHandlerFactory
  }

  get router() {
    return this.props.router
  }

  get prefix() {
    return this.props.prefix
  }

  add<R extends RouteDef, H extends RouteHandlerBase<any>, RS>(
    route: R,
    getHandler: (handlerFactory: HF) => H,
    invokeHandler: (handler: H, request: RequestType<R>) => Promise<RS>
  ) {
    const {method} = route
    const requestSchema = route.request ?? z.any()
    const responseSchema = route.response
    const routePath = route.path
    const handler: IRouterRequestHandler = async (request, response) => {
      const requestResponse: IRouterRequestResponse = {request, response}
      const handlerFactory = this.createHandlerFactory(requestResponse)
      const handler = getHandler(handlerFactory)
      await handler.baseHandleRequest(
        handler,
        requestSchema,
        responseSchema,
        invokeHandler
      )
    }
    const fullPath = path.join(this.prefix, routePath)
    switch (method) {
      case "GET":
        this.router.get(fullPath, handler)
        break
      case "POST":
        this.router.post(fullPath, handler)
        break
      default:
        throw new Error(`Unknown method "${method}"`)
    }
  }

  nested<A extends RouteDefs>(
    n: GroupRouteDef<A>,
    f: (r: RoutesServerHelper<HF>, a: A) => void
  ) {
    const prefix = n[":hb:prefix"]
    const nestedRouter = new RoutesServerHelper<HF>({
      router: this.router,
      createHandlerFactory: this.createHandlerFactory,
      prefix: path.join(this.prefix, prefix),
    })
    f(nestedRouter, n)
  }
}
