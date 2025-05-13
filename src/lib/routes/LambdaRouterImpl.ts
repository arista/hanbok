import {
  IRouter,
  IRouterRequestHandler,
  IRouterRequest,
  IRouterResponse,
  StringMap,
} from "./IRouter"
import router from "find-my-way"
import {HTTPMethod} from "find-my-way"
import Router from "find-my-way"
import {APIGatewayEvent, APIGatewayProxyResult, Context} from "aws-lambda"

export class LambdaRouterImpl implements IRouter {
  r: Router.Instance<Router.HTTPVersion.V1> = router({
    ignoreTrailingSlash: true,
    caseSensitive: true,
  })

  get(path: string, handler: IRouterRequestHandler): void {
    this._register("GET", path, handler)
  }

  post(path: string, handler: IRouterRequestHandler): void {
    this._register("POST", path, handler)
  }

  _register(method: HTTPMethod, path: string, handler: IRouterRequestHandler) {
    console.log(`LambdaRouterImpl: _register, method: ${method}, path: ${path}`)
    this.r.on(method, path, () => {
      return (req: IRouterRequest, res: IRouterResponse) => handler(req, res)
    })
  }

  async handleRequest(
    e: APIGatewayEvent
  ): Promise<APIGatewayProxyResult | null> {
    const {
      httpMethod,
      path,
      headers,
      multiValueHeaders,
      queryStringParameters,
      multiValueQueryStringParameters,
    } = e
    const method = stringToHttpMethod(httpMethod)
    const route = this.r.find(method, path)
    if (route == null) {
      return null
    } else {
      const {handler, params} = route
      const actualHandler: IRouterRequestHandler = (handler as any)()
      const request = new LambdaRequest(e, params)
      const response = new LambdaResponse()
      await actualHandler(request, response)
      return response.result
    }
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

export class LambdaRequest implements IRouterRequest {
  _params: StringMap
  _bodyParsed = false
  _body: any

  constructor(
    public e: APIGatewayEvent,
    params: {[k: string]: string | undefined}
  ) {
    this._params = params
  }

  get params() {
    return this._params
  }

  get query() {
    return this.e.queryStringParameters ?? {}
  }

  get body() {
    if (!this._bodyParsed) {
      this._body = this._parseBody(this.e)
      this._bodyParsed = true
    }
    return this._body
  }

  get headers() {
    return this.e.headers
  }

  _parseBody(event: APIGatewayEvent): any {
    const contentType = (
      event.headers["content-type"] ||
      event.headers["Content-Type"] ||
      ""
    ).toLowerCase()
    let rawBody = event.body ?? ""

    // Decode if base64-encoded
    if (event.isBase64Encoded) {
      rawBody = Buffer.from(rawBody, "base64").toString("utf-8")
    }
    try {
      if (contentType.includes("application/json")) {
        return JSON.parse(rawBody)
      }

      if (contentType.includes("application/x-www-form-urlencoded")) {
        return Object.fromEntries(new URLSearchParams(rawBody))
      }

      // fallback: return string directly
      return rawBody
    } catch (err) {
      console.warn("Error parsing body:", err)
      return undefined
    }
  }
}

export class LambdaResponse implements IRouterResponse {
  result: APIGatewayProxyResult = {
    statusCode: 200,
    headers: {},
    multiValueHeaders: {},
    body: "",
    isBase64Encoded: false,
  }

  status(code: number) {
    this.result.statusCode = code
    return this
  }

  json(body: any): void {
    this.type("application/json")
    this.result.body = JSON.stringify(body)
  }

  type(value: string) {
    this.set("content-type", value)
  }

  set(field: string, value: string) {
    const headers = (this.result.headers ||= {})
    headers[field.toLowerCase()] = value
  }

  send(body: string) {
    this.result.body = body
    this.isSent = true
  }

  isSent = false
}
