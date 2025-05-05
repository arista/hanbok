import {ApiDef, ApiDefRoute, RequestType, getGroupMetadata} from "./ApiDef"
import {ApiHandlerBase} from "./ApiHandlerBase"
import type {
  IRouter,
  IRouterRequestHandler,
  IRouterRequestResponse,
} from "./IRouter"
import {z} from "zod"
import path from "node:path"

export class ApiDefRouter<HF> {
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

  add<R extends ApiDefRoute, H extends ApiHandlerBase<any>, RS>(
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

  nested<A extends ApiDef>(n: A, f: (r: ApiDefRouter<HF>, a: A) => void) {
    const {prefix} = n
    const group = getGroupMetadata(n)
    const nestedRouter = new ApiDefRouter<HF>({
      router: this.router,
      createHandlerFactory: this.createHandlerFactory,
      prefix: path.join(this.prefix, group.prefix),
    })
    f(nestedRouter, n)
  }
}
