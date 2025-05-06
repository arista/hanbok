// Generates a client from a RoutesDef, which allows applications to
// make calls according to a structure mapping the RoutesDef.  For
// example
//
//   response = await client.users.create({params:..., query: ..., body: ...})
//
// The client is created by createRoutesClient.  This produces the
// client structure, but doesn't handle the requests itself.  Instead,
// requests are passed to a ClientRequestHandler, which is given
// enough information to make the request.  An application may choose
// to simply handle the request (sendClientRequest is a helper that
// can make that easy), or it may wrap its own additional logic around
// the request handling.

import {RouteDefs, isGroup, isRoute, getGroupRouteMetadata} from "./RouteDefs"
import {compile} from "path-to-regexp"

export type RoutesClientCall<RQ extends RoutesClientRequest, RS> = (
  request: RQ
) => Promise<RS>
export type RoutesClientRequest = {
  params?: Record<string, string>
  headers?: Record<string, string>
  query?: Record<string, string>
  body?: any
}
export type RoutesClient = {
  [name: string]: RoutesClient | RoutesClientCall<any, any>
}
export type ClientRequest = {
  method: string
  path: string
  headers?: Record<string, string>
  body?: any
}
export type ClientRequestHandler<RS> = (request: ClientRequest) => Promise<RS>

export function createRoutesClient(
  routeDefs: RouteDefs,
  handler: ClientRequestHandler<any>
): RoutesClient {
  const ret: RoutesClient = {}
  _createRoutesClient("/", routeDefs, ret, handler)
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

export function _createRoutesClient(
  prefix: string,
  routeDefs: RouteDefs,
  routesClient: RoutesClient,
  handler: ClientRequestHandler<any>
) {
  for (const [key, value] of Object.entries(routeDefs)) {
    if (isGroup(value)) {
      const groupRoutesClient: RoutesClient = {}
      routesClient[key] = groupRoutesClient
      const groupPrefix = getGroupRouteMetadata(value).prefix
      const fullGroupPrefix = joinPath(prefix, groupPrefix)
      _createRoutesClient(fullGroupPrefix, value, groupRoutesClient, handler)
    } else if (isRoute(value)) {
      routesClient[key] = (() => {
        const {method} = value
        const routePath = joinPath(prefix, value.path)
        let compiledPath: ReturnType<typeof compile> | null = null

        return async (req: RoutesClientRequest) => {
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
