import {
  ApiDef,
  ApiDefRoute,
  isGroup,
  isRoute,
  getGroupMetadata,
  ApiDefMethod,
} from "./ApiDef"
import {compile} from "path-to-regexp"

export type ClientApiCall<RQ extends ClientApiRequest, RS> = (
  request: RQ
) => Promise<RS>
export type ClientApiRequest = {
  params?: Record<string, string>
  headers?: Record<string, string>
  query?: Record<string, string>
  body?: any
}
export type ClientApi = {[name: string]: ClientApi | ClientApiCall<any, any>}
export type ClientRequest = {
  method: string
  path: string
  headers?: Record<string, string>
  body?: any
}
export type ClientRequestHandler<RS> = (request: ClientRequest) => Promise<RS>

export function createClientApi(
  apiDef: ApiDef,
  handler: ClientRequestHandler<any>
): ClientApi {
  const ret: ClientApi = {}
  _createClientApi("/", apiDef, ret, handler)
  return ret
}

export function joinPath(...parts: string[]): string {
  if (parts.length === 0) return ""

  const startsWithSlash = parts[0]?.startsWith("/")

  const cleaned = parts
    .map(
      (p, i) => p.replace(/^\/+|\/+$/g, "") // remove leading/trailing slashes
    )
    .filter(Boolean)

  const joined = cleaned.join("/")

  return startsWithSlash ? "/" + joined : joined
}

export function _createClientApi(
  prefix: string,
  apiDef: ApiDef,
  clientApi: ClientApi,
  handler: ClientRequestHandler<any>
) {
  for (const [key, value] of Object.entries(apiDef)) {
    if (isGroup(value)) {
      const groupClientApi: ClientApi = {}
      clientApi[key] = groupClientApi
      const groupPrefix = getGroupMetadata(value).prefix
      const fullGroupPrefix = joinPath(prefix, groupPrefix)
      _createClientApi(fullGroupPrefix, value, groupClientApi, handler)
    } else if (isRoute(value)) {
      clientApi[key] = (() => {
        const {method} = value
        const routePath = joinPath(prefix, value.path)
        let compiledPath: ReturnType<typeof compile> | null = null

        return async (req: ClientApiRequest) => {
          const {params, query, headers, body} = req ?? {}
          if (compiledPath == null) {
            compiledPath = compile(routePath, {encode: encodeURIComponent})
          }
          const clientRequestPath = compiledPath(params ?? {})
          const clientRequest: ClientRequest = {
            method,
            path: clientRequestPath,
            headers,
            body,
          }
          return await handler(clientRequest)
        }
      })()
    }
  }
}

export function sendClientRequest<RS>(
  webappApiEndpoint: string,
  request: ClientRequest
): Promise<Response> {
  const {method, path, headers, body} = request

  // fetch requires a full url, so if the webappApiEndpoint is a
  // relative url, resolve it relative to the current window's origin
  const absoluteBase =
    webappApiEndpoint.startsWith("http://") ||
    webappApiEndpoint.startsWith("https://")
      ? webappApiEndpoint
      : new URL(webappApiEndpoint, window.location.origin).toString()

  // Add the request's path
  const normalizedPath = path.startsWith("/") ? path.substring(1) : path
  const fullUrl = joinPath(absoluteBase, normalizedPath)
  const url = new URL(fullUrl)

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  }

  if (body != null) {
    init.body = JSON.stringify(body)
  }

  return fetch(url.toString(), init)
}
