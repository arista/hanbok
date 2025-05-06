import {
  ApiDef,
  ApiDefRoute,
  isGroup,
  isRoute,
  getGroupMetadata,
  ApiDefMethod,
} from "./ApiDef"
import {compile} from "path-to-regexp"
import path from "node:path"

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
      const fullGroupPrefix = path.join(prefix, groupPrefix)
      createClientApi(fullGroupPrefix, value, groupClientApi, handler)
    } else if (isRoute(value)) {
      clientApi[key] = (() => {
        const {method, path} = value
        let compiledPath: ReturnType<typeof compile> | null = null

        return async (req: ClientApiRequest) => {
          const {params, query, headers, body} = req
          if (compiledPath == null) {
            compiledPath = compile(path, {encode: encodeURIComponent})
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
  const url = new URL(path, webappApiEndpoint)

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
