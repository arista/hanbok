import {
  IRouter,
  IRouterRequestHandler,
  IRouterRequest,
  IRouterResponse,
} from "./IRouter"
import router from "find-my-way"
import {HTTPMethod} from "find-my-way"
import Router from "find-my-way"
import http from "node:http"

export class FindMyWayRouter implements IRouter {
  r: Router.Instance<Router.HTTPVersion.V1> = router({
    ignoreTrailingSlash: true,
    caseSensitive: true,
    defaultRoute: (req, res) => {
      res.statusCode = 404
      res.end("Not Found")
    },
  })

  get(path: string, handler: IRouterRequestHandler): void {
    this._register("GET", path, handler)
  }

  post(path: string, handler: IRouterRequestHandler): void {
    this._register("POST", path, handler)
  }

  _register(method: HTTPMethod, path: string, handler: IRouterRequestHandler) {
    this.r.on(method, path, async (req, res, params, store, searchParams) => {
      const routerRequest: IRouterRequest = {
        params,
        query: searchParams,
        body: (req as any).body,
      }
      const routerResponse = new FindMyWayRouterResponse({
        res,
      })
      await handler(routerRequest, routerResponse)
    })
  }
}

function stringToHttpMethod(str: string): HTTPMethod {
  switch (str) {
    case "GET":
    case "POST":
      return str
    default:
      throw new Error(`Unrecognized HTTPMethod "${str}"`)
  }
}

export class FindMyWayRouterResponse implements IRouterResponse {
  constructor(
    public props: {
      res: http.ServerResponse
    }
  ) {}

  status(code: number): IRouterResponse {
    this.props.res.statusCode = code
    return this
  }

  type(value: string): void {
    this.set("Content-Type", value)
  }

  set(field: string, value: string): void {
    this.props.res.setHeader(field, value)
  }

  json(body: any): void {
    this.type("application/json")
    this.send(JSON.stringify(body))
  }

  send(body: string): void {
    this.props.res.end(body)
    this.isSent = true
  }

  isSent = false
}
