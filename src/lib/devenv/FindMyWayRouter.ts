import {
  IRouter,
  IRouterRequestHandler,
  IRouterRequest,
  IRouterResponse,
} from "./IRouter"
import router from "find-my-way"
import {HTTPMethod} from "find-my-way"
import Router from "find-my-way"

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
    this.r.on(method, path, () => {
      return (req: IRouterRequest, res: IRouterResponse) => handler(req, res)
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
