// Simplified interfaces used by ExpressApiHelpers and request
// handlers.  These should be a subset of the express api, but also
// able to be implemented on the lambda side.

export interface IRouter {
  get(path: string, handler: IRouterRequestHandler): void
  post(path: string, handler: IRouterRequestHandler): void
}

export type IRouterRequestHandler = (
  req: IRouterRequest,
  res: IRouterResponse
) => Promise<void>

export type StringMap = {[key: string]: string | undefined}

export interface IRouterRequest {
  params: StringMap
  query: StringMap
  body: any
}

export interface IRouterResponse {
  status(code: number): IRouterResponse
  type(value: string): void
  set(field: string, value: string): void
  json(body: any): void
  send(body: string): void
}
