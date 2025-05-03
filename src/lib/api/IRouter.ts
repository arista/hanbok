// Simplified interfaces used by ExpressApiHelpers and request
// handlers.  These should be a subset of the express api, but also
// able to be implemented on the lambda side.

import {ZodFormattedError} from "zod"

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
  isSent: boolean
}

export interface IRouterRequestResponse {
  request: IRouterRequest
  response: IRouterResponse
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
  }
}

export class InvalidRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidRequestError"
  }
}

export class InvalidDataError extends Error {
  constructor(
    message: string,
    public error: ZodFormattedError<unknown, string>
  ) {
    super(message)
    this.name = "InvalidDataError"
  }
}
